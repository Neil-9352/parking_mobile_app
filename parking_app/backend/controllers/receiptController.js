/**
 * Receipt Controller
 * Handles receipt retrieval from the parks_in table
 */

const pool = require('../config/db');

/**
 * Get all receipts for a user
 * GET /api/receipts/user/:user_id
 * Returns records from parks_in table for all vehicles owned by the user
 */
const getUserReceipts = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Get all receipts for vehicles belonging to this user
    const [receipts] = await pool.query(
      `SELECT 
        pi.id,
        pi.registration_number,
        pi.slot_id,
        pi.lot_id,
        pi.fee_id,
        pi.in_time,
        pi.out_time,
        pi.fee,
        pi.receipt_path,
        pl.lot_name,
        ps.slot_no
      FROM parks_in pi
      JOIN vehicle v ON pi.registration_number = v.registration_number
      JOIN parking_lot pl ON pi.lot_id = pl.lot_id
      JOIN parking_slot ps ON pi.slot_id = ps.slot_id
      WHERE v.user_id = ?
      ORDER BY pi.in_time DESC`,
      [user_id]
    );

    res.status(200).json({
      success: true,
      message: 'Receipts retrieved successfully',
      data: receipts,
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching receipts',
    });
  }
};

module.exports = { getUserReceipts };
