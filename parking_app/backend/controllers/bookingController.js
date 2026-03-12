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
        ps.slot_no,
        ps.slot_id,
        pl.lot_name,
        pl.lot_id
      FROM books b
      JOIN parking_slot ps ON b.slot_id = ps.slot_id
      JOIN parking_lot pl ON ps.lot_id = pl.lot_id
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
      'SELECT * FROM books WHERE booking_id = ? AND user_id = ? FOR UPDATE',
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

    // Cancel booking and process refund — only update books table
    await connection.query(
      "UPDATE books SET booking_status = 'CANCELLED', refund_status = 'REFUNDED' WHERE booking_id = ?",
      [booking_id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Refund of ₹500 will be processed.',
      data: {
        booking_id: parseInt(booking_id),
        booking_status: 'CANCELLED',
        refund_status: 'REFUNDED',
        refund_amount: BOOKING_DEPOSIT,
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
