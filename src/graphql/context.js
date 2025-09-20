import { verifyToken, extractTokenFromHeader, generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';
import prisma from '../../prisma/client.js';
import config from '../config/env.js';
import { logger } from '../config/index.js';

/**
 * GraphQL context function
 * Creates a context object for each GraphQL request with user authentication
 * @param {Object} options - Context function options
 * @returns {Object} - Context object
 */
export const createContext = async ({ req, res }) => {
    try {
        // Get token from authorization header
        const authHeader = req?.headers?.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return { user: null, res };
        }

        try {
            // Verify token
            const user = verifyToken(token);
            logger.debug(`GraphQL request authenticated for user: ${user.id}`);
            return { user, res };
        } catch (error) {
            console.log("Error", error)

            if (error.name === 'TokenExpiredError') {
                logger.warn('Access token expired, attempting to refresh');

                // Extract refresh token from cookies
                const refreshToken = req.cookies?.refreshToken;
                if (!refreshToken) {
                    logger.warn('No refresh token provided');
                    return { user: null, res };
                }

                try {
                    // Verify refresh token
                    const user = verifyToken(refreshToken, true); // Pass a flag to indicate refresh token

                    // Generate new tokens
                    const newAccessToken = generateAccessToken(user);
                    const newRefreshToken = generateRefreshToken(user);
                    const expirationTime = config.jwt.accessExpiration || 3600; // Default to 1 hour if undefined
                    if (isNaN(expirationTime) || expirationTime <= 0) {
                        logger.error(`Invalid JWT access expiration time: ${config.jwt.accessExpiration}`);
                        throw new Error('Invalid JWT access expiration time');
                    }

                    // Update refresh token in database
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            authToken: newAccessToken,
                            authTokenExpiry: new Date(Date.now() + expirationTime * 1000).toISOString(), // Corrected to ensure valid Date
                        },
                    });

                    // Set new refresh token in cookies
                    res.cookie('refreshToken', newRefreshToken, {
                        httpOnly: true,
                        secure: config.nodeEnv === 'production',
                        sameSite: 'strict',
                        maxAge: config.jwt.refreshExpiration * 1000,
                    });

                    logger.info(`Refreshed tokens for user: ${user.id}`);
                    return { user, res };
                } catch (refreshError) {
                    logger.error(`Invalid refresh token: ${refreshError.message}`);
                    return { user: null, res };
                }
            }

            logger.warn(`Invalid token in GraphQL request: ${error.message}`);
            return { user: null, res };
        }
    } catch (error) {
        logger.error(`Error in GraphQL context: ${error.message}`);
        return { user: null, res };
    }
};

/**
 * Create subscription context
 * Handles user authentication for WebSocket connections
 * @param {Object} options - Context function options
 * @returns {Object} - Context object
 */
export const createSubscriptionContext = async ({ _token, refreshToken }) => {
    try {
        const token = extractTokenFromHeader(_token)
        if (!token && !refreshToken) {
            throw new Error('Authentication token is required');
        }

        try {
            const user = verifyToken(token);
            logger.debug(`WebSocket connection authenticated for user: ${user.id}`);
            return { user };
        } catch (error) {
            if (error.name === 'TokenExpiredError' && refreshToken) {
                logger.warn('Access token expired, attempting to refresh');

                try {
                    const user = verifyToken(refreshToken, true); // Verify refresh token
                    const newAccessToken = generateAccessToken(user);
                    const newRefreshToken = generateRefreshToken(user);

                    logger.info(`Refreshed tokens for user: ${user.id}`);
                    return { user, newAccessToken, newRefreshToken };
                } catch (refreshError) {
                    logger.error(`Invalid refresh token: ${refreshError.message}`);
                    return { user: null };
                }
            }
            logger.error(`WebSocket connection error: ${error.message}`);
            return { user: null };
        }
    } catch (error) {
        logger.error(`Error in subscription context: ${error.message}`);
        return { user: null };
    }
};