/**
 * Slot Booking Lock Job
 *
 * Runs every minute and enforces the "3-hour pre-booking lock" rule:
 *
 *   LOCKING:
 *     For every ACTIVE booking where NOW() >= (expected_start_time - 3 hours)
 *     AND the booking window has not yet ended (NOW() < expected_end_time),
 *     set parking_slot.status = 'booked' — so the walk-in system cannot
 *     allocate that slot to a walk-in vehicle.
 *
 *   RELEASING:
 *     If a slot is marked 'booked' but has no qualifying ACTIVE booking
 *     (booking cancelled, completed, no-show, or the time window has ended)
 *     AND the slot is not physically occupied (status != 'occupied'),
 *     revert it to 'unoccupied'.
 *
 * Edge cases handled:
 *   - Overlapping bookings: the slot stays 'booked' as long as ANY qualifying
 *     ACTIVE booking still holds it.
 *   - Physically occupied slots: never reverted to 'unoccupied' here — only
 *     the physical exit handler (refundHandler.js) should do that.
 *   - Already-correct status: both queries use WHERE guards to avoid no-op
 *     updates and unnecessary dirty rows.
 */

const cron = require('node-cron');
const pool = require('../config/db');

// ─── Query: find slots that SHOULD be locked right now ───────────────────────
//
// A slot needs locking when at least one ACTIVE booking for it has entered its
// 3-hour pre-booking window (start - 3h <= NOW < end_time).
// We join directly so there is one round-trip and the DB optimiser can use the
// index on (slot_id, expected_start_time, expected_end_time).
const SQL_LOCK_SLOTS = `
  UPDATE parking_slot ps
  INNER JOIN (
    SELECT DISTINCT b.slot_id
    FROM books b
    WHERE b.booking_status = 'ACTIVE'
      AND NOW() >= b.expected_start_time - INTERVAL 3 HOUR
      AND NOW()  < b.expected_end_time
  ) AS qualifying ON ps.slot_id = qualifying.slot_id
  SET ps.status = 'booked'
  WHERE ps.status = 'unoccupied'
`;

// ─── Query: find slots that SHOULD be released ────────────────────────────────
//
// A slot should be reverted when it is currently 'booked' but has no
// ACTIVE booking inside the 3-hour pre-lock window.
// We must NOT touch 'occupied' slots — they are managed by refundHandler.js.
const SQL_RELEASE_SLOTS = `
  UPDATE parking_slot ps
  SET ps.status = 'unoccupied'
  WHERE ps.status = 'booked'
    AND NOT EXISTS (
      SELECT 1 FROM books b
      WHERE b.slot_id        = ps.slot_id
        AND b.booking_status = 'ACTIVE'
        AND NOW() >= b.expected_start_time - INTERVAL 3 HOUR
        AND NOW()  < b.expected_end_time
    )
`;

// ─── Main job function ────────────────────────────────────────────────────────

const runSlotBookingLockJob = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lock slots whose pre-booking window has started
    const [lockResult] = await connection.query(SQL_LOCK_SLOTS);

    // 2. Release slots whose qualifying booking no longer exists
    const [releaseResult] = await connection.query(SQL_RELEASE_SLOTS);

    await connection.commit();

    if (lockResult.affectedRows > 0) {
      console.log(`[SlotBookingLockJob] 🔒 Locked ${lockResult.affectedRows} slot(s) — entering 3-hour pre-booking window.`);
    }
    if (releaseResult.affectedRows > 0) {
      console.log(`[SlotBookingLockJob] 🔓 Released ${releaseResult.affectedRows} slot(s) — no qualifying active booking.`);
    }
  } catch (error) {
    await connection.rollback();
    console.error('[SlotBookingLockJob] ❌ Error during slot status sync:', error);
  } finally {
    connection.release();
  }
};

// ─── Scheduler ────────────────────────────────────────────────────────────────

const startSlotBookingLockJob = () => {
  // Runs every minute: "* * * * *"
  cron.schedule('* * * * *', async () => {
    await runSlotBookingLockJob();
  });

  console.log('[SlotBookingLockJob] Slot booking lock job started (runs every minute).');
};

module.exports = { startSlotBookingLockJob };
