import { publish, TOPICS } from '../../pubsub/index.js';
import { logger } from '../../../config/index.js';

/**
 * Base Domain - Mutation Resolvers
 * Contains common/shared mutations like test triggers, etc.
 */
export const baseMutations = {
    // Test mutation to trigger subscriptions
    triggerTestSubscription: async (_, { message }, { user }) => {
        const timestamp = new Date();
        const testData = {
            id: Date.now().toString(),
            message: message || `Authenticated test from script at ${timestamp.toLocaleTimeString()}`,
            timestamp: timestamp.toISOString()
        };

        // Publish the event
        publish(TOPICS.TEST_SUBSCRIPTION, { testSubscription: testData });

        logger.info('Test subscription event triggered', { testData, user: user?.id });

        // Return TestPayload directly (not wrapped in apiResponse)
        return testData;
    },

    // Base placeholder mutations
    _: () => true,
};