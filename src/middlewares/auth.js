const jwt = require('jsonwebtoken');
const { sanitizeForLogs } = require('../utils/sanitize');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    // Fail safe: If no secret is provided in production, we must stop. 
    // In dev, we can throw, or user must set it. 
    // For this exercise, we will log a critical error and exit if strictly in prod, 
    // but for the demo we'll assume it's properly set or test will fail.
    // Making it fail-fast:
    if (process.env.NODE_ENV === 'production') {
        logger.error('FATAL: JWT_SECRET is not defined.');
        process.exit(1);
    } else {
        logger.warn('WARNING: JWT_SECRET is not defined. Using insecure default for development ONLY.');
    }
}

const SECRET_KEY = JWT_SECRET || 'dev_secret_UNSAFE';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // Reduced log level for common 401s to avoid spamming logs, or keep as warn for security monitoring
        logger.debug('Access denied: No token provided', sanitizeForLogs({ ip: req.ip }));
        return res.status(401).json({ error: 'Access denied: Token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            logger.warn('Access denied: Invalid token', sanitizeForLogs({ ip: req.ip, error: err.message }));
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    });
};

module.exports = authenticateToken;

