/**
 * Receipt Routes
 * GET /api/receipts/user/:user_id - Get all receipts for a user (auth required)
 */

const express = require('express');
const router = express.Router();
const { getUserReceipts } = require('../controllers/receiptController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.get('/user/:user_id', authMiddleware, getUserReceipts);

module.exports = router;
