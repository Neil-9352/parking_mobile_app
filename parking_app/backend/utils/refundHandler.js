/**
 * Refund Handler Utility
 * Processes refunds when a vehicle exits the parking lot
 *
 * When a vehicle exits (out_time updated in parks_in):
 * 1. booking_status → COMPLETED
 * 2. refund_status → REFUNDED
 *
 * Note: parking_slot.status is used ONLY for real-time occupancy
 * (occupied/unoccupied based on physical presence), not for booking logic.
 */

const pool = require('../config/db');

/**
 * Process vehicle exit and handle refund
 * @param {string} registration_number - Vehicle registration number
 * @param {number} slot_id - The slot the vehicle was parked in
 * @param {number} parking_record_id - The parks_in record ID
 */
const processVehicleExit = async (registration_number, slot_id, parking_record_id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Update the parks_in record with out_time
    await connection.query(
      'UPDATE parks_in SET out_time = NOW() WHERE id = ? AND out_time IS NULL',
      [parking_record_id]
    );

    // Find the active booking for this vehicle and slot
    const [bookings] = await connection.query(
      `SELECT booking_id FROM books 
       WHERE registration_number = ? 
         AND slot_id = ? 
         AND booking_status = 'ACTIVE' 
       ORDER BY booking_time DESC 
       LIMIT 1`,
      [registration_number, slot_id]
    );

    if (bookings.length > 0) {
      // Update booking status to COMPLETED and refund status to REFUNDED
      await connection.query(
        `UPDATE books
         SET booking_status = 'COMPLETED',
             refund_status = 'REFUNDED',
             refund_percentage = 100.00,
             refund_amount = booking_amount
         WHERE booking_id = ?`,
        [bookings[0].booking_id]
      );
    }

    // Update real-time slot occupancy (vehicle physically left)
    await connection.query(
      "UPDATE parking_slot SET status = 'unoccupied' WHERE slot_id = ?",
      [slot_id]
    );

    await connection.commit();

    console.log(`✅ Vehicle exit processed: ${registration_number}, Slot: ${slot_id}, Refund: COMPLETED`);

    return {
      success: true,
      message: 'Vehicle exit processed. Booking completed and refund initiated.',
      booking_id: bookings.length > 0 ? bookings[0].booking_id : null,
    };
  } catch (error) {
    await connection.rollback();
    console.error('❌ Refund handler error:', error);

    return {
      success: false,
      message: 'Error processing vehicle exit',
      error: error.message,
    };
  } finally {
    connection.release();
  }
};

module.exports = { processVehicleExit };
