import prisma from '../../../../prisma/client.js';
import { logger } from '../../../config/index.js';
import { ForbiddenError, NotFoundError } from '../../../utils/errors.js';
import { apiResponse } from '../../../utils/response.js';

/**
 * User Domain - Query Resolvers
 * Contains all user-related queries: me, user, users
 */
export const userQueries = {
    // Get authenticated user's profile
    me: (_, __, { user }) => {
        if (!user) {
            throw new ForbiddenError('Authentication required');
        }
        logger.debug(`GraphQL me query executed for user: ${user.id}`);
        return prisma.user.findUnique({
            where: { id: user.id }
        }).then(userData => apiResponse({
            status: true,
            message: 'User profile fetched successfully',
            data: userData,
        }));
    },

    // Get user by ID
    user: async (_, { id }, { user }) => {
        // Only allow admins or the user themselves to fetch user details
        if (!user || (user.id !== id && user.role !== 'ADMIN')) {
            throw new ForbiddenError('Not authorized to access this user');
        }
        logger.debug(`GraphQL user query executed for user: ${id}`);
        const userData = await prisma.user.findUnique({
            where: { id }
        });
        if (!userData) {
            throw new NotFoundError('User not found');
        }
        return apiResponse({
            status: true,
            message: 'User fetched successfully',
            data: userData,
        });
    },

    // Get all users (admin only)
    users: async (_, __, { user }) => {
        if (!user || user.role !== 'ADMIN') {
            throw new ForbiddenError('Admin access required');
        }
        logger.debug('GraphQL users query executed');
        const users = await prisma.user.findMany();
        return apiResponse({
            status: true,
            message: 'All users fetched successfully',
            data: users,
        });
    }
};