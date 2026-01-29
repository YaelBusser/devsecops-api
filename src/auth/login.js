const express = require('express');
const logger = require('../config/logger');
const { sanitizeForLogs } = require('../utils/sanitize');
const { loginAttemptsTotal } = require('../config/prometheus-config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'temporary_secret_change_me';

module.exports = (pool) => {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    // ... logic uses 'pool' passed in argument
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      logger.info('Login attempt', sanitizeForLogs({ username }));

      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);

      if (result.rows.length === 0) {
        loginAttemptsTotal.inc({ status: 'failed' });
        logger.warn('Login failed', sanitizeForLogs({ username }));
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        loginAttemptsTotal.inc({ status: 'failed' });
        logger.warn('Login failed', sanitizeForLogs({ username }));
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Secure Secret Handling
      const JWT_SECRET = process.env.JWT_SECRET;
      const SECRET_KEY = JWT_SECRET || 'dev_secret_UNSAFE';

      if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
        logger.error('Login Error: JWT_SECRET not set in production');
        return res.status(500).json({ error: 'Internal server error' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      loginAttemptsTotal.inc({ status: 'success' });
      logger.info('Login success', sanitizeForLogs({ username }));

      res.json({
        success: true,
        token: token,
        user: { id: user.id, username: user.username, role: user.role }
      });

    } catch (err) {
      loginAttemptsTotal.inc({ status: 'failed' });
      logger.error('Login error', sanitizeForLogs({ message: err.message }));
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
