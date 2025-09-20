// Quick test script to trigger a mutation
const testMutation = async () => {
    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation TriggerTestSubscription($message: String!) {
                        triggerTestSubscription(message: $message) {
                            id
                            message
                            timestamp
                        }
                    }
                `,
                variables: {
                    message: "Test from script at " + new Date().toLocaleTimeString()
                }
            })
        });

        const result = await response.json();
        console.log('Mutation result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error triggering mutation:', error);
    }
};

// Trigger mutation every 5 seconds for testing
console.log('Starting mutation test...');
testMutation();
setInterval(testMutation, 5000);