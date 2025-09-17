import { verifyToken, extractTokenFromHeader } from '../utils/jwtUtils.js';
import { logger } from '../config/index.js';

/**
 * GraphQL context function
 * Creates a context object for each GraphQL request with user authentication
 * @param {Object} options - Context function options
 * @returns {Object} - Context object
 */
export const createContext = async ({ req }) => {
    try {
        // Get token from authorization header
        const authHeader = req?.headers?.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return { user: null };
        }

        // Verify token
        try {
            const user = verifyToken(token);
            logger.debug(`GraphQL request authenticated for user: ${user.id}`);
            return { user };
        } catch (error) {
            logger.warn(`Invalid token in GraphQL request: ${error.message}`);
            return { user: null };
        }
    } catch (error) {
        logger.error(`Error in GraphQL context: ${error.message}`);
        return { user: null };
    }
};