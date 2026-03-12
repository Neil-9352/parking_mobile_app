/**
 * Booking Routes
 * POST /api/bookings/create              - Create a new booking (auth required)
 * GET  /api/bookings/my                  - Get user's bookings (auth required)
 * POST /api/bookings/cancel/:booking_id  - Cancel a booking (auth required)
 */

const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking } = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/create', authMiddleware, createBooking);
router.get('/my', authMiddleware, getMyBookings);
router.post('/cancel/:booking_id', authMiddleware, cancelBooking);

module.exports = router;
