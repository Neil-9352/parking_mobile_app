/**
 * Pending Payment Cleanup Job
 *
 * Runs every minute and deletes PAYMENT_PENDING booking rows that are older
 * than 10 minutes. These represent sessions where:
 *  - The user opened the Razorpay checkout but never completed payment, AND
 *  - The client never called /api/bookings/payment-failed to clean up explicitly
 *    (e.g. app crash, network loss).
 *
 * Deleting stale PAYMENT_PENDING rows immediately frees the held slot for other users.
 */

const cron = require('node-cron');
const pool = require('../config/db');

const cleanupPendingPayments = async () => {
  try {
    const [result] = await pool.query(
      `DELETE FROM books
       WHERE booking_status = 'PAYMENT_PENDING'
         AND booking_time <= NOW() - INTERVAL 10 MINUTE`
    );

    if (result.affectedRows > 0) {
      console.log(
        `[PendingPaymentCleanup] Removed ${result.affectedRows} stale PAYMENT_PENDING booking(s).`
      );
    }
  } catch (error) {
    console.error('[PendingPaymentCleanup] Error during cleanup:', error);
  }
};

/**
 * Start the pending payment cleanup job.
 * Schedules cleanupPendingPayments() to run every minute.
 */
const startPendingPaymentCleanupJob = () => {
  cron.schedule('* * * * *', async () => {
    await cleanupPendingPayments();
  });

  console.log('[PendingPaymentCleanup] Stale payment cleanup job started (runs every minute).');
};

module.exports = { startPendingPaymentCleanupJob };
