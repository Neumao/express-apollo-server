import { userMutations } from './mutations.js';
import { userQueries } from './queries.js';

/**
 * User Domain Resolvers
 * Combines all user-related mutations, queries, and subscriptions
 */
export const userResolvers = {
    // User mutations
    ...userMutations,

    // User queries  
    ...userQueries,

    // User subscriptions would go here if we had any user-specific subscriptions
    // For now, subscriptions are handled in the base domain
};