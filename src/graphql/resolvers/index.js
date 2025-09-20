import { userResolvers } from './user/index.js';
import { baseResolvers } from './base/index.js';
import typeResolvers from './typeResolvers.js';

/**
 * Combined GraphQL Resolvers
 * Organized by domain/model for better maintainability
 */
const resolvers = {
    // Merge type resolvers (DateTime, custom scalars, etc.)
    ...typeResolvers,

    // Root resolver types - combine all domain resolvers
    Query: {
        // Base/Common queries
        hello: baseResolvers.hello,
        _: baseResolvers._,

        // User domain queries
        me: userResolvers.me,
        user: userResolvers.user,
        users: userResolvers.users,
    },

    Mutation: {
        // Base/Common mutations
        triggerTestSubscription: baseResolvers.triggerTestSubscription,
        _: baseResolvers._,

        // User domain mutations
        register: userResolvers.register,
        login: userResolvers.login,
        logout: userResolvers.logout,
        updateUser: userResolvers.updateUser,
        deleteUser: userResolvers.deleteUser,
    },

    Subscription: {
        // Base/Common subscriptions
        testSubscription: baseResolvers.testSubscription,
        _: baseResolvers._,

        // User domain subscriptions would go here when added
        // Future: userCreated, userUpdated, etc.
    },
};

export default resolvers;