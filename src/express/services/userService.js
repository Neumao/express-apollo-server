import bcrypt from 'bcrypt';
import { logger } from '../../config/logger.js';
import { ValidationError, NotFoundError, ConflictError } from '../../utils/errors.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwtUtils.js';
import prisma from '../../../prisma/client.js';

/**
 * Service for user-related operations
 */
export class UserService {
    /**
     * Create a new user
     * @param {Object} userData - User data for registration
     * @returns {Object} Created user (without password)
     */
    static async createUser(userData) {
        const { email, password, firstName, lastName } = userData;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            logger.warn(`Registration attempt with existing email: ${email}`);
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        try {
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: 'USER', // Default role
                },
            });

            logger.info(`User created: ${user.id}`);

            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    /**
     * Authenticate user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Authentication data with tokens and user info
     */
    static async login(email, password) {
        if (!email || !password) {
            logger.error('Login attempt with missing email or password');
            throw new ValidationError('Email and password are required');
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            logger.warn(`Login attempt with non-existent email: ${email}`);
            throw new ValidationError('Invalid email or password');
        }

        if (!user.password) {
            logger.error(`User record for ${email} is missing a password`);
            throw new ValidationError('Invalid email or password');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            logger.warn(`Failed login attempt for user: ${user.id}`);
            throw new ValidationError('Invalid email or password');
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Update refresh token in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken,
                lastLogin: new Date(),
            },
        });

        logger.info(`User logged in: ${user.id}`);

        // Return authentication data
        const { password: _, ...userWithoutPassword } = user;
        return {
            accessToken,
            refreshToken,
            user: userWithoutPassword,
        };
    }

    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - User's refresh token
     * @returns {Object} New access token and user info
     */
    static async refreshToken(refreshToken) {
        // Find user by refresh token
        const user = await prisma.user.findFirst({
            where: { refreshToken },
        });

        if (!user) {
            logger.warn('Invalid refresh token used');
            throw new ValidationError('Invalid refresh token');
        }

        // Generate new access token
        const accessToken = generateAccessToken(user);

        logger.info(`Access token refreshed for user: ${user.id}`);

        // Return new access token and user info
        const { password: _, ...userWithoutPassword } = user;
        return {
            accessToken,
            user: userWithoutPassword,
        };
    }

    /**
     * Get user by ID
     * @param {string} id - User ID
     * @returns {Object} User data (without password)
     */
    static async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Update user profile
     * @param {string} id - User ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated user (without password)
     */
    static async updateUser(id, updateData) {
        const { password, email, ...otherData } = updateData;
        const updatePayload = { ...otherData };

        // If changing email, check if new email already exists
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser && existingUser.id !== id) {
                throw new ConflictError('User with this email already exists');
            }

            updatePayload.email = email;
        }

        // If changing password, hash it
        if (password) {
            const saltRounds = 10;
            updatePayload.password = await bcrypt.hash(password, saltRounds);
            updatePayload.tokenVersion = { increment: 1 }; // Invalidate existing tokens
        }

        // Update user
        try {
            const updatedUser = await prisma.user.update({
                where: { id },
                data: updatePayload,
            });

            logger.info(`User updated: ${id}`);

            // Return updated user without password
            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundError('User not found');
            }
            throw error;
        }
    }

    /**
     * Logout user by invalidating refresh token
     * @param {string} id - User ID
     * @returns {Object} Success message
     */
    static async logout(id) {
        await prisma.user.update({
            where: { id },
            data: {
                refreshToken: null,
                tokenVersion: { increment: 1 }, // Invalidate existing tokens
            },
        });

        logger.info(`User logged out: ${id}`);

        return { message: 'Logout successful' };
    }

    /**
     * Delete user account
     * @param {string} id - User ID
     * @returns {Object} Success message
     */
    static async deleteUser(id) {
        try {
            await prisma.user.delete({
                where: { id },
            });

            logger.info(`User deleted: ${id}`);

            return { message: 'User deleted successfully' };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundError('User not found');
            }
            throw error;
        }
    }
}