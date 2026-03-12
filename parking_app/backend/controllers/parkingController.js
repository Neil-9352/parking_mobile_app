/**
 * Parking Controller
 * Handles parking lot and slot retrieval
 *
 * Slot availability is determined by checking for overlapping ACTIVE bookings
 * in the `books` table — NOT by parking_slot.status.
 */

const pool = require('../config/db');

/**
 * Get all parking lots with date-aware availability
 * GET /api/parking/lots?start_time=...&end_time=...
 */
const getLots = async (req, res) => {
  try {
    const { start_time, end_time } = req.query;

    let lots;

    if (start_time && end_time) {
      // Date-aware: count slots that have no overlapping ACTIVE booking
      [lots] = await pool.query(`
        SELECT 
          pl.lot_id,
          pl.lot_name,
          pl.address,
          pl.layout_image_path,
          COUNT(ps.slot_id) AS total_slots,
          SUM(
            CASE WHEN ps.slot_id NOT IN (
              SELECT b.slot_id FROM books b
              WHERE b.booking_status = 'ACTIVE'
                AND b.expected_start_time < ?
                AND b.expected_end_time > ?
            ) THEN 1 ELSE 0 END
          ) AS available_slots
        FROM parking_lot pl
        LEFT JOIN parking_slot ps ON pl.lot_id = ps.lot_id
        GROUP BY pl.lot_id, pl.lot_name, pl.address, pl.layout_image_path
      `, [end_time, start_time]);
    } else {
      // Fallback: real-time status
      [lots] = await pool.query(`
        SELECT 
          pl.lot_id,
          pl.lot_name,
          pl.address,
          pl.layout_image_path,
          COUNT(ps.slot_id) AS total_slots,
          SUM(CASE WHEN ps.status = 'unoccupied' THEN 1 ELSE 0 END) AS available_slots
        FROM parking_lot pl
        LEFT JOIN parking_slot ps ON pl.lot_id = ps.lot_id
        GROUP BY pl.lot_id, pl.lot_name, pl.address, pl.layout_image_path
      `);
    }

    res.status(200).json({
      success: true,
      message: 'Parking lots retrieved successfully',
      data: lots,
    });
  } catch (error) {
    console.error('Get lots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching parking lots',
    });
  }
};

/**
 * Get all slots in a specific parking lot with time-based availability
 * GET /api/parking/slots/:lot_id?start_time=...&end_time=...
 *
 * Each slot is returned with an `available` boolean:
 *   true  → no overlapping ACTIVE booking exists
 *   false → an overlapping ACTIVE booking exists
 */
const getSlots = async (req, res) => {
  try {
    const { lot_id } = req.params;
    const { start_time, end_time } = req.query;

    // Verify lot exists
    const [lot] = await pool.query(
      'SELECT lot_id, lot_name, layout_image_path FROM parking_lot WHERE lot_id = ?',
      [lot_id]
    );

    if (lot.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parking lot not found',
      });
    }

    let slots;

    if (start_time && end_time) {
      // Time-based availability: check booking overlaps
      [slots] = await pool.query(`
        SELECT 
          ps.slot_id,
          ps.slot_no,
          ps.status,
          CASE WHEN ps.slot_id IN (
            SELECT b.slot_id FROM books b
            WHERE b.booking_status = 'ACTIVE'
              AND b.expected_start_time < ?
              AND b.expected_end_time > ?
          ) THEN 0 ELSE 1 END AS available
        FROM parking_slot ps
        WHERE ps.lot_id = ?
        ORDER BY ps.slot_no
      `, [end_time, start_time, lot_id]);
    } else {
      // Fallback: use real-time status
      [slots] = await pool.query(
        `SELECT slot_id, slot_no, status,
                CASE WHEN status = 'unoccupied' THEN 1 ELSE 0 END AS available
         FROM parking_slot WHERE lot_id = ? ORDER BY slot_no`,
        [lot_id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Slots retrieved successfully',
      data: {
        lot: lot[0],
        slots,
      },
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching slots',
    });
  }
};

module.exports = { getLots, getSlots };
