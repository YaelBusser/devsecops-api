const logger = require('../config/logger');
const { sanitizeForLogs } = require('../utils/sanitize');

/**
 * Middleware for Role-Based Access Control (RBAC)
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.warn('Unauthorized access: No user found', sanitizeForLogs({ ip: req.ip, path: req.path }));
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            logger.warn('Forbidden access: Insufficient permissions', sanitizeForLogs({
                username: req.user.username,
                role: req.user.role,
                required: allowedRoles
            }));
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

module.exports = authorize;
