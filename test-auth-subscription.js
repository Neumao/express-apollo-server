// Test script for authenticated subscriptions

// First, let's get an authentication token by logging in
async function getAuthToken() {
    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation Login($input: LoginInput!) {
                        login(input: $input) {
                            status
                            message
                            data {
                                id
                                email
                                role
                                authToken
                            }
                        }
                    }
                `,
                variables: {
                    input: {
                        email: "nazifmalhi@gmail.com",
                        password: "123"
                    }
                }
            })
        });

        const result = await response.json();

        if (result.data && result.data.login && result.data.login.status) {
            console.log('✅ Login successful!');
            console.log('User:', result.data.login.data);
            const token = result.data.login.data.authToken;
            console.log('Token:', token.substring(0, 50) + '...');
            return token;
        } else {
            console.error('❌ Login failed:', result.errors || result);
            return null;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return null;
    }
}

// Test authenticated mutation
async function testAuthenticatedMutation(token) {
    try {
        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
                    message: "Authenticated test from script at " + new Date().toLocaleTimeString()
                }
            })
        });

        const result = await response.json();
        console.log('🚀 Authenticated mutation result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Mutation error:', error);
    }
}

// Main test function
async function testAuthentication() {
    console.log('🔐 Testing Apollo v5 Subscription Authentication...\n');

    // Get authentication token
    const token = await getAuthToken();

    if (token) {
        console.log('\n📋 Instructions for testing authenticated subscriptions:');
        console.log('1. Copy this token:', token);
        console.log('2. In Apollo Studio, click on "Connection Params" in the bottom left');
        console.log('3. Add this JSON:');
        console.log('   {');
        console.log('     "authorization": "Bearer ' + token + '"');
        console.log('   }');
        console.log('4. Start your subscription');
        console.log('5. This script will trigger authenticated mutations\n');

        // Trigger mutations every 5 seconds
        setInterval(() => testAuthenticatedMutation(token), 5000);

        // Trigger first mutation immediately
        await testAuthenticatedMutation(token);
    } else {
        console.log('❌ Could not get authentication token. Make sure the server is running and seeded.');
    }
}

// Run the test
testAuthentication();