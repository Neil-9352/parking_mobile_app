/**
 * Parking Routes
 * GET /api/parking/lots          - Get all parking lots
 * GET /api/parking/slots/:lot_id - Get slots in a specific lot
 */

const express = require('express');
const router = express.Router();
const { getLots, getSlots } = require('../controllers/parkingController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.get('/lots', authMiddleware, getLots);
router.get('/slots/:lot_id', authMiddleware, getSlots);

module.exports = router;
