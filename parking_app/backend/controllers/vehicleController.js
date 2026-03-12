/**
 * Vehicle Controller
 * Handles vehicle registration and retrieval
 */

const pool = require('../config/db');

/**
 * Add a new vehicle
 * POST /api/vehicles/add
 * Body: { registration_number, type }
 * user_id is extracted from JWT token
 */
const addVehicle = async (req, res) => {
  try {
    const { registration_number, type } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!registration_number || !type) {
      return res.status(400).json({
        success: false,
        message: 'Registration number and vehicle type are required',
      });
    }

    // Validate vehicle type
    if (!['2-wheeler', '4-wheeler'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle type must be "2-wheeler" or "4-wheeler"',
      });
    }

    // Check if vehicle already exists
    const [existing] = await pool.query(
      'SELECT registration_number, user_id FROM vehicle WHERE registration_number = ?',
      [registration_number]
    );

    if (existing.length > 0) {
      // Vehicle exists but has no user linked — claim it
      if (existing[0].user_id === null) {
        await pool.query(
          'UPDATE vehicle SET user_id = ?, type = ? WHERE registration_number = ?',
          [user_id, type, registration_number]
        );

        return res.status(200).json({
          success: true,
          message: 'Existing vehicle linked to your account successfully',
          data: { registration_number, type, user_id },
        });
      }

      // Vehicle already belongs to a user
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this registration number is already registered to a user',
      });
    }

    // Vehicle doesn't exist — create new
    await pool.query(
      'INSERT INTO vehicle (registration_number, type, user_id) VALUES (?, ?, ?)',
      [registration_number, type, user_id]
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: {
        registration_number,
        type,
        user_id,
      },
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding vehicle',
    });
  }
};

/**
 * Get all vehicles belonging to the authenticated user
 * GET /api/vehicles/my
 */
const getMyVehicles = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [vehicles] = await pool.query(
      'SELECT registration_number, type, user_id FROM vehicle WHERE user_id = ?',
      [user_id]
    );

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: vehicles,
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching vehicles',
    });
  }
};

module.exports = { addVehicle, getMyVehicles };
