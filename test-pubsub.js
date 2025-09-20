import { pubsub, TOPICS } from './src/graphql/pubsub/index.js';

// Test Apollo v5 Native PubSub functionality
const testApollo5PubSub = async () => {
    console.log('🧪 Testing Apollo Server v5 Native PubSub...');

    console.log('PubSub instance:', pubsub);
    console.log('Has asyncIterator?', typeof pubsub.asyncIterator);
    console.log('PubSub methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pubsub)));

    if (typeof pubsub.asyncIterator === 'function') {
        console.log('✅ asyncIterator is available');

        // Test the async iterator
        console.log('🔄 Testing subscription flow...');

        // Start listening to the subscription
        const asyncIterator = pubsub.asyncIterator(TOPICS.TEST_SUBSCRIPTION);

        // Publish a test event after a short delay
        setTimeout(() => {
            console.log('📤 Publishing test event...');
            pubsub.publish(TOPICS.TEST_SUBSCRIPTION, {
                testSubscription: {
                    id: '1',
                    message: 'Hello Apollo v5!',
                    timestamp: new Date().toISOString()
                }
            });
        }, 1000);

        // Listen for one event
        console.log('👂 Waiting for subscription event...');
        const result = await asyncIterator.next();
        console.log('📨 Received event:', result.value);

        console.log('🎉 Apollo v5 native subscriptions working perfectly!');

    } else {
        console.log('❌ asyncIterator is NOT available');
    }

    process.exit(0);
};

testApollo5PubSub().catch(console.error);