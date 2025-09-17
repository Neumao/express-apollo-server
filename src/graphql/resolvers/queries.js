import { prisma } from '../../prisma/client.js';
import { logger } from '../../config/index.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';

/**
 * GraphQL Query Resolvers
 */
const queries = {
    // Hello world query for testing
    hello: () => {
        logger.debug('GraphQL hello query executed');
        return 'Hello from Apollo Server!';
    },

    // Get authenticated user's profile
    me: (_, __, { user }) => {
        if (!user) {
            throw new ForbiddenError('Authentication required');
        }

        logger.debug(`GraphQL me query executed for user: ${user.id}`);
        return prisma.user.findUnique({
            where: { id: user.id }
        });
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

        return userData;
    },

    // Get all users (admin only)
    users: async (_, __, { user }) => {
        if (!user || user.role !== 'ADMIN') {
            throw new ForbiddenError('Admin access required');
        }

        logger.debug('GraphQL users query executed');

        return prisma.user.findMany();
    }
};

export default queries;