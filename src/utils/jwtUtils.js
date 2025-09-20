import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from './errors.js';

/**
 * Utility functions for JWT token generation and verification
 */

/**
 * Generate an access token for a user
 * @param {Object} user - User data to encode in the token
 * @returns {string} JWT access token
 */
export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.accessExpiration
        }
    );
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User data to encode in the token
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            tokenVersion: user.tokenVersion || 0  // For token invalidation
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.refreshExpiration
        }
    );
};

/**
 * Verify a token and return its decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or expired
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw error;
        } else {
            throw error;
        }
    }
};

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found/valid
 */
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
};