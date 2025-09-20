# GraphQL Subscriptions Guide

Learn how to implement real-time features using GraphQL subscriptions with WebSocket authentication.

## Overview

This server implements GraphQL subscriptions using:
- **Apollo Server v5** native subscriptions
- **WebSocket** transport via `graphql-ws`
- **JWT Authentication** for WebSocket connections
- **Automatic Token Refresh** for uninterrupted subscriptions

## Quick Start

### 1. Basic Subscription

```graphql
# Subscribe to test events
subscription {
  testSubscription {
    id
    message
    timestamp
  }
}
```

### 2. Trigger Events

```graphql
# Trigger a test event
mutation {
  triggerTestSubscription(message: "Hello WebSocket!") {
    id
    message
    timestamp
  }
}
```

## Client Setup

### Apollo Client with Subscriptions

```javascript
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: () => ({
    authorization: `Bearer ${localStorage.getItem('accessToken')}`
  }),
  // Handle connection errors
  on: {
    error: (error) => {
      console.error('WebSocket error:', error);
    },
    closed: () => {
      console.log('WebSocket connection closed');
    }
  }
}));

// Split link - use WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

### React Hook Example

```jsx
import { useSubscription, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const TEST_SUBSCRIPTION = gql`
  subscription TestSubscription {
    testSubscription {
      id
      message
      timestamp
    }
  }
`;

const TRIGGER_TEST = gql`
  mutation TriggerTest($message: String!) {
    triggerTestSubscription(message: $message) {
      id
      message
      timestamp
    }
  }
`;

function RealtimeComponent() {
  const { data, loading, error } = useSubscription(TEST_SUBSCRIPTION);
  const [triggerTest] = useMutation(TRIGGER_TEST);
  
  const handleTrigger = () => {
    triggerTest({
      variables: { message: `Test at ${new Date().toISOString()}` }
    });
  };
  
  if (loading) return <p>Connecting to real-time updates...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <div>
      <button onClick={handleTrigger}>Trigger Event</button>
      {data && (
        <div>
          <h3>Latest Event:</h3>
          <p>ID: {data.testSubscription.id}</p>
          <p>Message: {data.testSubscription.message}</p>
          <p>Time: {data.testSubscription.timestamp}</p>
        </div>
      )}
    </div>
  );
}
```

## Authentication for Subscriptions

### Connection Authentication

WebSocket connections require authentication via connection parameters:

```javascript
const wsClient = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: async () => {
    let token = localStorage.getItem('accessToken');
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      try {
        // Refresh token before connecting
        const refreshToken = localStorage.getItem('refreshToken');
        const newTokens = await refreshAccessToken(refreshToken);
        token = newTokens.authToken;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', newTokens.refreshToken);
      } catch (error) {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return {};
      }
    }
    
    return {
      authorization: `Bearer ${token}`
    };
  }
});
```

### Automatic Token Refresh

The server handles token refresh automatically for WebSocket connections:

```javascript
// Server-side context (graphql/context.js)
export const createContext = async ({ req, connectionParams }) => {
  // For subscriptions (WebSocket)
  if (connectionParams) {
    const token = connectionParams.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      // Verify token
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });
      
      return { user, isSubscription: true };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Auto-refresh logic handled by client reconnection
        throw new Error('Token expired - please reconnect');
      }
      throw new Error('Invalid token');
    }
  }
  
  // For HTTP requests (queries/mutations)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });
      return { user, req };
    } catch (error) {
      // Let mutations handle refresh
      return { req };
    }
  }
  
  return { req };
};
```

## Available Subscriptions

### Test Subscription

**Purpose**: Development and testing real-time functionality

```graphql
subscription TestSubscription {
  testSubscription {
    id          # Unique event ID
    message     # Event message
    timestamp   # ISO timestamp
  }
}
```

**Trigger**:
```graphql
mutation TriggerTest($message: String!) {
  triggerTestSubscription(message: $message) {
    id
    message
    timestamp
  }
}
```

### User Events (Future)

Planned subscriptions for user-related events:

```graphql
# User status changes
subscription UserUpdates($userId: ID!) {
  userUpdated(userId: $userId) {
    id
    name
    email
    lastLoginAt
  }
}

# New user registrations (admin only)
subscription NewUsers {
  userRegistered {
    id
    name
    email
    createdAt
  }
}
```

## Creating Custom Subscriptions

### 1. Define Schema

```graphql
# graphql/schema/subscription.graphql
type Subscription {
  # Existing
  testSubscription: TestPayload!
  
  # New custom subscription
  notificationReceived(userId: ID!): NotificationPayload!
}

type NotificationPayload {
  id: ID!
  userId: ID!
  title: String!
  message: String!
  type: NotificationType!
  createdAt: String!
}

enum NotificationType {
  INFO
  WARNING
  ERROR
  SUCCESS
}
```

### 2. Create Resolver

```javascript
// graphql/resolvers/base/subscriptions.js
import { pubsub } from '../../pubsub/index.js';

export const notificationReceived = {
  subscribe: async (parent, { userId }, context) => {
    // Check authentication
    if (!context.user) {
      throw new Error('Authentication required');
    }
    
    // Check authorization (user can only subscribe to their own notifications)
    if (context.user.id !== userId && context.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    
    return pubsub.asyncIterator([`NOTIFICATION_${userId}`]);
  }
};
```

### 3. Trigger Events

```javascript
// graphql/resolvers/user/mutations.js
import { pubsub } from '../../pubsub/index.js';

export const sendNotification = async (parent, { input }, context) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  
  const notification = {
    id: generateId(),
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    createdAt: new Date().toISOString()
  };
  
  // Save to database
  const savedNotification = await prisma.notification.create({
    data: notification
  });
  
  // Publish to subscribers
  pubsub.publish(`NOTIFICATION_${input.userId}`, {
    notificationReceived: savedNotification
  });
  
  return {
    status: 'success',
    message: 'Notification sent',
    data: savedNotification
  };
};
```

## Error Handling

### Connection Errors

```javascript
const wsClient = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: () => ({
    authorization: `Bearer ${getToken()}`
  }),
  on: {
    error: (error) => {
      console.error('WebSocket error:', error);
      
      // Handle specific error types
      if (error.message.includes('Token expired')) {
        // Attempt token refresh and reconnect
        refreshTokenAndReconnect();
      } else if (error.message.includes('Authentication required')) {
        // Redirect to login
        window.location.href = '/login';
      }
    },
    closed: (event) => {
      console.log('WebSocket closed:', event);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        wsClient.dispose();
        // Create new client and reconnect
      }, 1000);
    }
  }
});
```

### Subscription Errors

```jsx
function RealtimeComponent() {
  const { data, loading, error } = useSubscription(TEST_SUBSCRIPTION, {
    onError: (error) => {
      console.error('Subscription error:', error);
      
      // Handle different error types
      if (error.message.includes('Authentication')) {
        // Redirect to login
        window.location.href = '/login';
      }
    },
    onComplete: () => {
      console.log('Subscription completed');
    }
  });
  
  if (error) {
    return (
      <div className="error">
        <h3>Connection Error</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }
  
  // ... rest of component
}
```

## Performance Considerations

### Subscription Filtering

Filter events on the server to reduce bandwidth:

```javascript
export const userUpdated = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(['USER_UPDATED']),
    (payload, variables, context) => {
      // Only send updates for specific user
      return payload.userUpdated.id === variables.userId;
    }
  )
};
```

### Connection Limits

Implement connection limits to prevent abuse:

```javascript
// graphql/server.js
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    // Limit concurrent subscriptions per user
    {
      requestDidStart() {
        return {
          willSendResponse(requestContext) {
            const { request, response } = requestContext;
            
            // Track subscription count per user
            if (request.operationName?.includes('subscription')) {
              // Implement connection tracking logic
            }
          }
        };
      }
    }
  ]
});
```

## Testing Subscriptions

### Manual Testing

Use Apollo Studio at `http://localhost:4000/graphql`:

1. Open two tabs
2. In tab 1, start subscription:
   ```graphql
   subscription {
     testSubscription {
       id
       message
       timestamp
     }
   }
   ```
3. In tab 2, trigger event:
   ```graphql
   mutation {
     triggerTestSubscription(message: "Test message") {
       id
       message
       timestamp
     }
   }
   ```

### Automated Testing

```javascript
// tests/subscriptions.test.js
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

describe('GraphQL Subscriptions', () => {
  let client;
  
  beforeEach(() => {
    client = createClient({
      url: 'ws://localhost:4000/graphql',
      webSocketImpl: WebSocket,
      connectionParams: {
        authorization: `Bearer ${testToken}`
      }
    });
  });
  
  afterEach(() => {
    client.dispose();
  });
  
  test('should receive subscription events', (done) => {
    const subscription = client.iterate({
      query: `
        subscription {
          testSubscription {
            id
            message
            timestamp
          }
        }
      `
    });
    
    // Listen for events
    (async () => {
      for await (const result of subscription) {
        expect(result.data.testSubscription).toBeDefined();
        expect(result.data.testSubscription.message).toBe('Test message');
        done();
        break;
      }
    })();
    
    // Trigger event after short delay
    setTimeout(() => {
      triggerTestEvent('Test message');
    }, 100);
  });
});
```

## Production Considerations

### Scaling Subscriptions

For production environments with multiple server instances:

```javascript
// Use Redis for PubSub
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const options = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

export const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options)
});
```

### Monitoring

Track subscription metrics:

```javascript
// Track active connections
let activeConnections = 0;

const server = new ApolloServer({
  // ... config
  plugins: [
    {
      serverWillStart() {
        return {
          serverWillStop() {
            console.log(`Server stopping with ${activeConnections} active connections`);
          }
        };
      }
    }
  ]
});
```

## Troubleshooting

### Common Issues

**Connection Refused**
- Check if server is running on correct port
- Verify WebSocket endpoint URL
- Check firewall settings

**Authentication Errors**
- Verify token is included in connection params
- Check token expiration
- Ensure user exists in database

**No Events Received**
- Verify subscription is active
- Check event publishing logic
- Confirm subscription filters

**Memory Leaks**
- Properly dispose WebSocket clients
- Clean up subscription iterators
- Monitor connection count

## Next Steps

- [Authentication Guide](/guides/authentication) - Secure your subscriptions
- [Testing Guide](/guides/testing) - Test real-time features
- [GraphQL API Reference](/api/graphql/subscriptions) - Complete subscription documentation