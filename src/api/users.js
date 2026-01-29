const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../config/logger');
const { sanitizeForLogs } = require('../utils/sanitize');



const bcrypt = require('bcrypt');

// Enhanced User Creation with Metrics and Validation
const { userRegistrationsTotal } = require('../config/prometheus-config');

router.post('/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Security Fix: Strict Input Validation
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    // Email Validation Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password Strength Check
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const finalRole = 'user'; // Force role to user to prevent Privilege Escalation

    const checkQuery = 'SELECT id FROM users WHERE email = $1 OR username = $2';
    const checkResult = await pool.query(checkQuery, [email, username]);
    if (checkResult.rows.length > 0) {
      userRegistrationsTotal.inc({ status: 'failed' });
      return res.status(409).json({ error: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = 'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role';
    const values = [username, email, hashedPassword, finalRole];

    const result = await pool.query(query, values);

    // Metrics & Logging
    userRegistrationsTotal.inc({ status: 'success' });
    logger.info('User created', sanitizeForLogs({ username, email, role: finalRole }));

    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (err) {
    userRegistrationsTotal.inc({ status: 'error' });
    logger.error('Create user error', sanitizeForLogs({ message: err.message }));
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
