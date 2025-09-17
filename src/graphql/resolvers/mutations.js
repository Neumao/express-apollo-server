import bcrypt from 'bcrypt';
import { prisma } from '../../prisma/client.js';
import { logger } from '../../config/logger.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwtUtils.js';
import { ValidationError, ForbiddenError, NotFoundError, ConflictError } from '../../utils/errors.js';
import { publish, TOPICS } from '../pubsub/index.js';

/**
 * GraphQL Mutation Resolvers
 */
const mutations = {
    /**
     * Register a new user
     */
    register: async (_, { input }) => {
        const { email, password, firstName, lastName } = input;

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

            logger.info(`User created via GraphQL: ${user.id}`);

            // Publish user created event
            publish(TOPICS.USER_CREATED, { userCreated: { user } });

            return {
                message: 'User registered successfully',
                user,
            };
        } catch (error) {
            logger.error(`Error creating user via GraphQL: ${error.message}`);
            throw error;
        }
    },

    /**
     * Login user
     */
    login: async (_, { input }) => {
        const { email, password } = input;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            logger.warn(`Login attempt with non-existent email: ${email}`);
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

        logger.info(`User logged in via GraphQL: ${user.id}`);

        return {
            accessToken,
            refreshToken,
            user,
        };
    },

    /**
     * Refresh access token
     */
    refreshToken: async (_, { token }) => {
        // Find user by refresh token
        const user = await prisma.user.findFirst({
            where: { refreshToken: token },
        });

        if (!user) {
            logger.warn('Invalid refresh token used');
            throw new ValidationError('Invalid refresh token');
        }

        // Generate new access token
        const accessToken = generateAccessToken(user);

        logger.info(`Access token refreshed via GraphQL for user: ${user.id}`);

        return {
            accessToken,
            user,
        };
    },

    /**
     * Logout user
     */
    logout: async (_, __, { user }) => {
        if (!user) {
            throw new ForbiddenError('Authentication required');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: null,
                tokenVersion: { increment: 1 }, // Invalidate existing tokens
            },
        });

        logger.info(`User logged out via GraphQL: ${user.id}`);

        return { message: 'Logout successful' };
    },

    /**
     * Update user profile
     */
    updateUser: async (_, { id, input }, { user }) => {
        // Ensure user is authorized
        if (!user) {
            throw new ForbiddenError('Authentication required');
        }

        // Only allow users to update their own profile or admins to update any profile
        if (user.id !== id && user.role !== 'ADMIN') {
            throw new ForbiddenError('Not authorized to update this profile');
        }

        const { password, email, ...otherData } = input;
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

            logger.info(`User updated via GraphQL: ${id}`);

            // Publish user updated event
            publish(TOPICS.USER_UPDATED, { userUpdated: { user: updatedUser } });

            return {
                message: 'User updated successfully',
                user: updatedUser,
            };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundError('User not found');
            }
            throw error;
        }
    },

    /**
     * Delete user account
     */
    deleteUser: async (_, { id }, { user }) => {
        // Ensure user is authorized
        if (!user) {
            throw new ForbiddenError('Authentication required');
        }

        // Only allow users to delete their own account or admins to delete any account
        if (user.id !== id && user.role !== 'ADMIN') {
            throw new ForbiddenError('Not authorized to delete this account');
        }

        try {
            await prisma.user.delete({
                where: { id },
            });

            logger.info(`User deleted via GraphQL: ${id}`);

            // Publish user deleted event
            publish(TOPICS.USER_DELETED, { userDeleted: { userId: id } });

            return { message: 'User deleted successfully' };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundError('User not found');
            }
            throw error;
        }
    }
};

export default mutations;