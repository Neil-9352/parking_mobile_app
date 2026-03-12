/**
 * Authentication Routes
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login    - Login and get JWT token
 */

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);

module.exports = router;
