import { PubSub } from 'graphql-subscriptions';
import { logger } from '../../config/logger.js';

/**
 * PubSub instance for GraphQL subscriptions
 * Note: This is an in-memory PubSub implementation.
 * For production, consider using Redis PubSub or similar.
 */
const pubsub = new PubSub();

/**
 * Event topics for subscriptions
 * Keep all event names centralized here for better maintainability
 */
export const TOPICS = {
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    // Add more topics as needed
};

/**
 * Publish an event to a topic
 * @param {string} topic - Topic name from TOPICS
 * @param {*} payload - Event payload
 */
export const publish = (topic, payload) => {
    logger.debug(`Publishing to topic: ${topic}`);
    return pubsub.publish(topic, payload);
};

export { pubsub };