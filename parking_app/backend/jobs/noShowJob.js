/**
 * No-Show Job
 *
 * Runs every minute and marks ACTIVE bookings as NO_SHOW when:
 *  - The booking's expected_start_time + 15 minutes has passed, AND
 *  - No parks_in arrival record exists for that vehicle on that slot
 *    within a window of [expected_start_time - 30min, expected_start_time + 15min]
 *
 * NO_SHOW bookings receive refund_status = NOT_APPLICABLE (deposit is forfeited).
 */

const cron = require('node-cron');
const pool = require('../config/db');

const markNoShows = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Find all ACTIVE bookings whose grace window (start + 15 min) has elapsed
    // and for which the vehicle never arrived at the booked slot.
    // The app allows entry only within ±15 min of expected_start_time,
    // so we use the same window here.
    const [candidates] = await connection.query(
      `SELECT b.booking_id, b.registration_number, b.slot_id, b.expected_start_time
       FROM books b
       WHERE b.booking_status = 'ACTIVE'
         AND b.expected_start_time + INTERVAL 15 MINUTE <= NOW()
         AND NOT EXISTS (
           SELECT 1 FROM parks_in p
           WHERE p.registration_number = b.registration_number
             AND p.slot_id             = b.slot_id
             AND p.in_time >= b.expected_start_time - INTERVAL 15 MINUTE
             AND p.in_time <= b.expected_start_time + INTERVAL 15 MINUTE
         )`
    );

    if (candidates.length === 0) {
      connection.release();
      return;
    }

    const bookingIds = candidates.map((b) => b.booking_id);

    // Bulk-update: mark as NO_SHOW and forfeit the deposit (NOT_APPLICABLE)
    await connection.query(
      `UPDATE books
       SET booking_status = 'NO_SHOW',
           refund_status  = 'NOT_APPLICABLE'
       WHERE booking_id IN (?)`,
      [bookingIds]
    );

    await connection.commit();

    console.log(
      `[NoShowJob] Marked ${bookingIds.length} booking(s) as NO_SHOW: [${bookingIds.join(', ')}]`
    );
  } catch (error) {
    await connection.rollback();
    console.error('[NoShowJob] Error while processing no-shows:', error);
  } finally {
    connection.release();
  }
};

/**
 * Start the no-show checker.
 * Schedules markNoShows() to run every minute.
 */
const startNoShowJob = () => {
  // Runs at every minute: "* * * * *"
  cron.schedule('* * * * *', async () => {
    await markNoShows();
  });

  console.log('[NoShowJob] No-show checker started (runs every minute).');
};

module.exports = { startNoShowJob };
