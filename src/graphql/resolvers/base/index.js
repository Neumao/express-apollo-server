import { baseQueries } from './queries.js';
import { baseMutations } from './mutations.js';
import { baseSubscriptions } from './subscriptions.js';

/**
 * Base Domain Resolvers
 * Combines all common/shared mutations, queries, and subscriptions
 */
export const baseResolvers = {
    // Base queries
    ...baseQueries,

    // Base mutations
    ...baseMutations,

    // Base subscriptions
    ...baseSubscriptions,
};