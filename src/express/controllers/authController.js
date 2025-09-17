import { UserService } from '../services/userService.js';
import { logger } from '../../config/logger.js';
import { ValidationError, UnauthorizedError } from '../../utils/errors.js';

/**
 * Controller for authentication endpoints
 */
export class AuthController {
    /**
     * Register a new user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async register(req, res, next) {
        try {
            const { email, password, firstName, lastName } = req.body;

            // Basic validation
            if (!email || !password) {
                throw new ValidationError('Email and password are required');
            }

            // Create user
            const user = await UserService.createUser({
                email,
                password,
                firstName,
                lastName,
            });

            res.status(201).json({
                message: 'User registered successfully',
                user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Basic validation
            if (!email || !password) {
                throw new ValidationError('Email and password are required');
            }

            // Authenticate user
            const authData = await UserService.login(email, password);

            res.json(authData);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new ValidationError('Refresh token is required');
            }

            const refreshData = await UserService.refreshToken(refreshToken);

            res.json(refreshData);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async logout(req, res, next) {
        try {
            const { id } = req.user;

            const result = await UserService.logout(id);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async getCurrentUser(req, res, next) {
        try {
            const { id } = req.user;

            const user = await UserService.getUserById(id);

            res.json({ user });
        } catch (error) {
            next(error);
        }
    }
}