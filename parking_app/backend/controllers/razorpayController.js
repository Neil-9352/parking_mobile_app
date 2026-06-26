/**
 * Razorpay Controller
 * Creates a Razorpay Order for the ₹500 parking deposit.
 * The order_id is returned to the mobile client, which then opens the
 * native Razorpay checkout. The key_secret never leaves the server.
 *
 * POST /api/bookings/create-order
 * Auth required.
 */

const Razorpay = require('razorpay');

const BOOKING_DEPOSIT_PAISE = 50000; // ₹500 in paise

const razorpay = new Razorpay({
  key_id: process.env.RZRPAY_TEST_API_KEY,
  key_secret: process.env.RZRPAY_TEST_KEY_SECRET,
});

/**
 * Creates a Razorpay order for the deposit amount.
 * Returns: { order_id, key_id, amount, currency }
 */
const createOrder = async (req, res) => {
  try {
    const options = {
      amount: BOOKING_DEPOSIT_PAISE,
      currency: 'INR',
      receipt: `parking_deposit_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: String(req.user.id),
        purpose: 'Parking slot booking deposit',
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      success: true,
      data: {
        order_id: order.id,
        key_id: process.env.RZRPAY_TEST_API_KEY,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error('[Razorpay] Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order. Please try again.',
    });
  }
};

module.exports = { createOrder };
