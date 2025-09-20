import { pubsub, TOPICS } from '../../pubsub/index.js';
import { ForbiddenError } from '../../../utils/errors.js';
import { logger } from '../../../config/logger.js';

/**
 * Base Domain - Subscription Resolvers
 * Contains common/shared subscriptions like test subscriptions, system notifications, etc.
 */
export const baseSubscriptions = {
    testSubscription: {
        // Apollo v5 style subscription using async generator with authentication
        subscribe: async function* (parent, args, context) {
            logger.info('🚀 Starting testSubscription with Apollo v5 native async iterator');

            // Check authentication for subscription access
            if (!context.authenticated || !context.user) {
                logger.warn('🚫 Unauthorized subscription attempt');
                throw new ForbiddenError('Authentication required for subscriptions');
            }

            logger.info(`🔐 Authenticated subscription for user: ${context.user.id} (${context.user.email})`);

            // Start listening for events FIRST
            const asyncIterator = pubsub.asyncIterator(TOPICS.TEST_SUBSCRIPTION);

            // Send an initial "connected" message with user info
            yield {
                testSubscription: {
                    id: 'init',
                    message: `Subscription connected for ${context.user.email}! Waiting for events...`,
                    timestamp: new Date().toISOString()
                }
            };

            try {
                // Now listen for real events
                for await (const event of asyncIterator) {
                    logger.info('📨 Received subscription event, forwarding to authenticated client:', JSON.stringify(event));

                    // The event structure is { testSubscription: payload }
                    // We yield it directly since it's already in the correct format
                    yield event;
                }
            } finally {
                logger.info(`🔌 testSubscription iterator closed for user: ${context.user?.id}`);
            }
        },
    },

    // Base placeholder subscriptions
    _: {
        subscribe: async function* () {
            yield { _: true };
        }
    },
};