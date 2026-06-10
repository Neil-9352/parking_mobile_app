/**
 * Booking Controller
 * Handles booking creation, retrieval, and cancellation
 *
 * IMPORTANT: Booking availability is determined by time overlaps
 * in the `books` table, NOT by `parking_slot.status`.
 * We never update parking_slot.status from bookings.
 */

const pool = require('../config/db');

// Booking deposit amount in INR
const BOOKING_DEPOSIT = 500;

/**
 * Refund percentage by time left before expected_start_time.
 *
 * >=24h  : 100%
 * >=12h  : 80%
 * >=8h   : 60%
 * >=4h   : 40%
 * <4h    : 0%
 */
const getRefundPercentageByMinutes = (minutesBeforeStart) => {
  if (minutesBeforeStart >= 24 * 60) return 100;
  if (minutesBeforeStart >= 12 * 60) return 80;
  if (minutesBeforeStart >= 8 * 60) return 60;
  if (minutesBeforeStart >= 4 * 60) return 40;
  return 0;
};

const toTwoDecimalNumber = (value) => Number(Number(value).toFixed(2));

/**
 * Create a new booking
 * POST /api/bookings/create
 * Body: { registration_number, slot_id, expected_start_time, expected_end_time }
 * user_id is extracted from JWT token
 *
 * Checks for overlapping ACTIVE bookings on the same slot.
 * Does NOT update parking_slot.status.
 */
const createBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { registration_number, slot_id, expected_start_time, expected_end_time } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!registration_number || !slot_id || !expected_start_time || !expected_end_time) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: registration_number, slot_id, expected_start_time, expected_end_time',
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Verify that the vehicle belongs to the user
    const [vehicle] = await connection.query(
      'SELECT registration_number, type FROM vehicle WHERE registration_number = ? AND user_id = ?',
      [registration_number, user_id]
    );

    if (vehicle.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or does not belong to you',
      });
    }

    // Verify slot exists
    const [slot] = await connection.query(
      'SELECT slot_id, slot_no, lot_id FROM parking_slot WHERE slot_id = ?',
      [slot_id]
    );

    if (slot.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found',
      });
    }

    // Check for overlapping ACTIVE bookings on this slot
    const [overlapping] = await connection.query(
      `SELECT booking_id FROM books
       WHERE slot_id = ?
         AND booking_status = 'ACTIVE'
         AND expected_start_time < ?
         AND expected_end_time > ?
       LIMIT 1`,
      [slot_id, expected_end_time, expected_start_time]
    );

    if (overlapping.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked for the selected time period. Please choose another slot or time.',
      });
    }

    // Create booking — only insert into books, do NOT update parking_slot.status
    const [result] = await connection.query(
      `INSERT INTO books 
        (user_id, registration_number, slot_id, expected_start_time, expected_end_time, booking_amount, booking_status, refund_status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 'PENDING')`,
      [user_id, registration_number, slot_id, expected_start_time, expected_end_time, BOOKING_DEPOSIT]
    );

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking_id: result.insertId,
        user_id,
        registration_number,
        slot_id,
        slot_no: slot[0].slot_no,
        expected_start_time,
        expected_end_time,
        booking_amount: BOOKING_DEPOSIT,
        booking_status: 'ACTIVE',
        refund_status: 'PENDING',
        cancellation_time: null,
        refund_percentage: null,
        refund_amount: null,
        cancellation_charge: null,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating booking',
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all bookings for the authenticated user
 * GET /api/bookings/my
 */
const getMyBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [bookings] = await pool.query(
      `SELECT 
        b.booking_id,
        b.registration_number,
        b.booking_time,
        b.expected_start_time,
        b.expected_end_time,
        b.booking_amount,
        b.booking_status,
        b.refund_status,
        b.cancellation_time,
        b.refund_percentage,
        b.refund_amount,
        CASE
          WHEN f.fee_id IS NULL THEN NULL
          WHEN TIMESTAMPDIFF(MINUTE, b.expected_start_time, b.expected_end_time) <= 60
            THEN f.first_hour_charge
          ELSE f.first_hour_charge +
            (CEIL((TIMESTAMPDIFF(MINUTE, b.expected_start_time, b.expected_end_time) - 60) / 60.0) * f.rest_hour_charge)
        END AS expected_parking_charge,
        pi.fee AS actual_parking_charge,
        CASE
          WHEN b.refund_amount IS NULL THEN NULL
          ELSE ROUND(b.booking_amount - b.refund_amount, 2)
        END AS cancellation_charge,
        ps.slot_no,
        ps.slot_id,
        pl.lot_name,
        pl.lot_id,
        pi.in_time  AS actual_in_time,
        pi.out_time AS actual_out_time
      FROM books b
      LEFT JOIN vehicle v ON b.registration_number = v.registration_number
      JOIN parking_slot ps ON b.slot_id = ps.slot_id
      JOIN parking_lot pl ON ps.lot_id = pl.lot_id
      LEFT JOIN fee f
        ON  f.fee_id = (
          SELECT latest_fee.fee_id
          FROM fee latest_fee
          WHERE latest_fee.lot_id = pl.lot_id
            AND latest_fee.vehicle_type = v.type
          ORDER BY latest_fee.created_at DESC, latest_fee.fee_id DESC
          LIMIT 1
        )
      LEFT JOIN parks_in pi
        ON  pi.id = (
          SELECT latest_park.id
          FROM parks_in latest_park
          WHERE latest_park.registration_number = b.registration_number
            AND latest_park.slot_id = b.slot_id
            AND latest_park.in_time >= b.expected_start_time - INTERVAL 15 MINUTE
            AND latest_park.in_time <= b.expected_start_time + INTERVAL 15 MINUTE
          ORDER BY latest_park.in_time DESC, latest_park.id DESC
          LIMIT 1
        )
      WHERE b.user_id = ?
      ORDER BY b.booking_time DESC`,
      [user_id]
    );

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching bookings',
    });
  }
};

/**
 * Cancel a booking
 * POST /api/bookings/cancel/:booking_id
 *
 * Only updates the books table. Does NOT touch parking_slot.status.
 */
const cancelBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    await connection.beginTransaction();

    // Get booking details
    const [booking] = await connection.query(
      `SELECT
        b.*, 
        TIMESTAMPDIFF(MINUTE, NOW(), b.expected_start_time) AS minutes_before_start
       FROM books b
       WHERE b.booking_id = ? AND b.user_id = ?
       FOR UPDATE`,
      [booking_id, user_id]
    );

    if (booking.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to you',
      });
    }

    if (booking[0].booking_status !== 'ACTIVE') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled. Current status: ${booking[0].booking_status}`,
      });
    }

    const bookingAmount = Number(booking[0].booking_amount);
    const minutesBeforeStart = Number(booking[0].minutes_before_start);
    const refundPercentage = getRefundPercentageByMinutes(minutesBeforeStart);
    const refundAmount = toTwoDecimalNumber((bookingAmount * refundPercentage) / 100);
    const cancellationCharge = toTwoDecimalNumber(bookingAmount - refundAmount);
    const refundStatus = refundAmount > 0 ? 'REFUNDED' : 'NOT_APPLICABLE';

    // Cancel booking and apply staggered cancellation charges
    await connection.query(
      `UPDATE books
       SET booking_status = 'CANCELLED',
           refund_status = ?,
           cancellation_time = NOW(),
           refund_percentage = ?,
           refund_amount = ?
       WHERE booking_id = ?`,
      [refundStatus, refundPercentage, refundAmount, booking_id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Refund processed as per cancellation policy.',
      data: {
        booking_id: parseInt(booking_id, 10),
        booking_status: 'CANCELLED',
        refund_status: refundStatus,
        refund_percentage: refundPercentage,
        refund_amount: refundAmount,
        cancellation_charge: cancellationCharge,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling booking',
    });
  } finally {
    connection.release();
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking };
