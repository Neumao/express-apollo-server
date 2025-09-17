import queries from './queries.js';
import mutations from './mutations.js';
import subscriptions from './subscriptions.js';
import typeResolvers from './typeResolvers.js';

const resolvers = {
    // Merge type resolvers
    ...typeResolvers,

    // Root resolver types
    Query: queries,
    Mutation: mutations,
    Subscription: subscriptions,
};

export default resolvers;