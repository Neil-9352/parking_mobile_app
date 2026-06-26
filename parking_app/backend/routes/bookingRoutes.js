/**
 * Booking Routes
 * POST /api/bookings/create-order              - Create a Razorpay order for the deposit (auth required)
 * POST /api/bookings/create                    - Confirm booking after successful payment (auth required)
 * GET  /api/bookings/my                        - Get user's bookings (auth required)
 * POST /api/bookings/cancel/:booking_id        - Cancel a booking (auth required)
 * POST /api/bookings/payment-failed/:booking_id - Clean up PAYMENT_PENDING row on SDK failure (auth required)
 */

const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking, handlePaymentFailed } = require('../controllers/bookingController');
const { createOrder } = require('../controllers/razorpayController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/create-order', authMiddleware, createOrder);
router.post('/create', authMiddleware, createBooking);
router.get('/my', authMiddleware, getMyBookings);
router.post('/cancel/:booking_id', authMiddleware, cancelBooking);
router.post('/payment-failed/:booking_id', authMiddleware, handlePaymentFailed);

module.exports = router;
