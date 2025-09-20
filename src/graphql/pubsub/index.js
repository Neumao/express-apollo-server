import { EventEmitter } from 'events';
import { logger } from '../../config/logger.js';

/**
 * Apollo Server v5 Native PubSub Implementation
 * Using EventEmitter and async generators - no external dependencies
 */
class Apollo5PubSub {
    constructor() {
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(0); // Remove listener limit
    }

    /**
     * Publish an event to subscribers
     * @param {string} triggerName - Event name
     * @param {any} payload - Event payload
     */
    publish(triggerName, payload) {
        logger.debug(`Publishing to trigger: ${triggerName}`);
        this.eventEmitter.emit(triggerName, payload);
        return Promise.resolve();
    }

    /**
     * Create an async iterator for subscription
     * @param {string|string[]} triggers - Event name(s) to listen for
     * @returns {AsyncIterator} Async iterator for the subscription
     */
    async* asyncIterator(triggers) {
        const triggerNames = Array.isArray(triggers) ? triggers : [triggers];
        const pullQueue = [];
        const pushQueue = [];
        let listening = true;

        // Set up event listeners
        const eventListeners = {};

        triggerNames.forEach(triggerName => {
            const listener = (payload) => {
                logger.debug(`🔔 Event received on topic "${triggerName}":`, JSON.stringify(payload, null, 2));
                if (pushQueue.length) {
                    const { resolve } = pushQueue.shift();
                    logger.debug(`🎯 Delivering event immediately to waiting subscriber`);
                    resolve({ value: payload, done: false });
                } else {
                    logger.debug(`📝 Queuing event for future subscriber`);
                    pullQueue.push(payload);
                }
            };

            eventListeners[triggerName] = listener;
            this.eventEmitter.on(triggerName, listener);
        });

        // Cleanup function
        const cleanup = () => {
            listening = false;
            triggerNames.forEach(triggerName => {
                this.eventEmitter.removeListener(triggerName, eventListeners[triggerName]);
            });
        };

        try {
            while (listening) {
                if (pullQueue.length > 0) {
                    const event = pullQueue.shift();
                    logger.debug(`📦 Yielding queued event to subscriber`);
                    yield event;
                } else {
                    logger.debug(`⏳ Waiting for next event...`);
                    const { value } = await new Promise((resolve) => {
                        pushQueue.push({ resolve });
                    });
                    logger.debug(`📦 Yielding immediate event to subscriber`);
                    yield value;
                }
            }
        } finally {
            cleanup();
        }
    }
}

// Create a singleton instance
const pubsub = new Apollo5PubSub();

/**
 * Event topics for subscriptions
 * Keep all event names centralized here for better maintainability
 */
export const TOPICS = {
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    TEST_SUBSCRIPTION: 'TEST_SUBSCRIPTION',
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

// Export the pubsub instance
export { pubsub };

// Export default for easier importing
export default pubsub;