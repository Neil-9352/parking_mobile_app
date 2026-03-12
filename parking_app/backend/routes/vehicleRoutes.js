/**
 * Vehicle Routes
 * POST /api/vehicles/add - Register a vehicle (auth required)
 * GET  /api/vehicles/my  - Get user's vehicles (auth required)
 */

const express = require('express');
const router = express.Router();
const { addVehicle, getMyVehicles } = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/add', authMiddleware, addVehicle);
router.get('/my', authMiddleware, getMyVehicles);

module.exports = router;
