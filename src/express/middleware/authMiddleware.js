import { verifyToken, extractTokenFromHeader } from '../../utils/jwtUtils.js';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Authentication middleware for Express
 * Verifies JWT token and adds user data to request
 */
export const authMiddleware = (req, res, next) => {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            throw new UnauthorizedError('Authentication token required');
        }

        // Verify token and add user data to request
        const decoded = verifyToken(token);
        req.user = decoded;

        logger.debug(`User authenticated: ${decoded.id}`);
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Role-based authorization middleware for Express
 * Checks if authenticated user has required role(s)
 * @param {string|string[]} roles - Required role(s)
 */
export const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'));
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            logger.warn(`Access denied for user ${req.user.id}: requires ${allowedRoles}, has ${userRole}`);
            return next(new ForbiddenError(`Requires role: ${allowedRoles.join(' or ')}`));
        }

        logger.debug(`Role check passed for user ${req.user.id}: ${userRole}`);
        next();
    };
};