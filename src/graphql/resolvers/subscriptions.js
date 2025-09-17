import { pubsub, TOPICS } from '../pubsub/index.js';
import { ForbiddenError } from '../../utils/errors.js';

/**
 * GraphQL Subscription Resolvers
 */
const subscriptions = {
    /**
     * Subscription for user created events
     * Admin only
     */
    userCreated: {
        subscribe: (_, __, { user }) => {
            // Only admins can subscribe to user created events
            if (!user || user.role !== 'ADMIN') {
                throw new ForbiddenError('Not authorized to subscribe to user events');
            }

            return pubsub.asyncIterator([TOPICS.USER_CREATED]);
        }
    },

    /**
     * Subscription for user updated events
     * Admin or the user themselves
     */
    userUpdated: {
        subscribe: (_, { id }, { user }) => {
            // Only admins or the user themselves can subscribe to user updated events
            if (!user || (user.id !== id && user.role !== 'ADMIN')) {
                throw new ForbiddenError('Not authorized to subscribe to this user\'s updates');
            }

            // Filter events by user ID
            return {
                [Symbol.asyncIterator]() {
                    const asyncIterator = pubsub.asyncIterator([TOPICS.USER_UPDATED]);

                    return {
                        async next() {
                            const { value, done } = await asyncIterator.next();

                            if (done) {
                                return { value, done };
                            }

                            // Only return events for the specified user
                            if (value?.userUpdated?.user?.id === id) {
                                return { value, done };
                            }

                            // Skip events for other users
                            return this.next();
                        },

                        async return() {
                            return asyncIterator.return();
                        },

                        async throw(error) {
                            return asyncIterator.throw(error);
                        }
                    };
                }
            };
        }
    },

    /**
     * Subscription for user deleted events
     * Admin only
     */
    userDeleted: {
        subscribe: (_, __, { user }) => {
            // Only admins can subscribe to user deleted events
            if (!user || user.role !== 'ADMIN') {
                throw new ForbiddenError('Not authorized to subscribe to user events');
            }

            return pubsub.asyncIterator([TOPICS.USER_DELETED]);
        }
    }
};

export default subscriptions;