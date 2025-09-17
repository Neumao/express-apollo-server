import { UserService } from '../services/userService.js';
import { logger } from '../../config/logger.js';
import { ForbiddenError } from '../../utils/errors.js';
import { prisma } from '../../prisma/client.js';

/**
 * Controller for user endpoints
 */
export class UserController {
    /**
     * Get user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async getProfile(req, res, next) {
        try {
            const { id } = req.params;

            // If requesting other user's profile, check permissions
            if (id !== req.user.id && req.user.role !== 'ADMIN') {
                throw new ForbiddenError('Not authorized to access this profile');
            }

            const user = await UserService.getUserById(id);

            res.json({ user });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async updateProfile(req, res, next) {
        try {
            const { id } = req.params;

            // If updating other user's profile, check permissions
            if (id !== req.user.id && req.user.role !== 'ADMIN') {
                throw new ForbiddenError('Not authorized to update this profile');
            }

            const updatedUser = await UserService.updateUser(id, req.body);

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user account
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            // If deleting other user's account, check permissions
            if (id !== req.user.id && req.user.role !== 'ADMIN') {
                throw new ForbiddenError('Not authorized to delete this account');
            }

            const result = await UserService.deleteUser(id);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Admin only: Get all users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async getAllUsers(req, res, next) {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLogin: true,
                },
            });

            res.json({ users });
        } catch (error) {
            next(error);
        }
    }
}