/**
 * Authentication Controller
 * Handles user registration and login
 *
 * DB schema for `user` table:
 *   user_id  (PK, auto_increment)
 *   username (unique)
 *   password
 *   name
 *   phone
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { name, username, password, phone }
 */
const register = async (req, res) => {
  try {
    const { name, username, password, phone } = req.body;

    // Validate required fields
    if (!name || !username || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, username, password, phone',
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT user_id FROM user WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this username already exists',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO user (username, password, name, phone) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, name, phone]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user_id: result.insertId,
        name,
        username,
        phone,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Body: { username, password }
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Find user by username
    const [users] = await pool.query(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.user_id,
          name: user.name,
          username: user.username,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

module.exports = { register, login };
