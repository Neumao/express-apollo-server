# GraphQL Schema Documentation

Complete reference for all GraphQL types, queries, mutations, and subscriptions.

## Schema Overview

The GraphQL schema is organized into domains:

- **User Domain**: Authentication, user management
- **Base Domain**: Core functionality, testing, utilities

## Types

### User Type

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  createdAt: String!
  updatedAt: String!
  lastLoginAt: String
}
```

**Fields:**

- `id`: Unique user identifier (CUID)
- `name`: User's full name
- `email`: Unique email address
- `role`: User role (USER, ADMIN, MODERATOR)
- `createdAt`: Account creation timestamp (ISO 8601)
- `updatedAt`: Last account update timestamp (ISO 8601)
- `lastLoginAt`: Last login timestamp (ISO 8601, nullable)

### Role Enum

```graphql
enum Role {
  USER
  ADMIN
  MODERATOR
}
```

**Values:**

- `USER`: Standard user permissions
- `ADMIN`: Full system access
- `MODERATOR`: Limited administrative access

### Response Types

#### ApiResponse

```graphql
type ApiResponse {
  status: String!
  message: String!
  data: User
}
```

Generic response wrapper for mutations.

#### AuthResponse

```graphql
type AuthResponse {
  status: String!
  message: String!
  data: AuthPayload
}
```

Authentication-specific response.

#### AuthPayload

```graphql
type AuthPayload {
  id: ID!
  name: String!
  email: String!
  role: Role!
  authToken: String!
  refreshToken: String!
}
```

Contains user data and authentication tokens.

#### TestPayload

```graphql
type TestPayload {
  id: ID!
  message: String!
  timestamp: String!
}
```

Used for testing subscriptions and real-time features.

## Input Types

### RegisterInput

```graphql
input RegisterInput {
  name: String!
  email: String!
  password: String!
}
```

**Validation:**

- `name`: 2-50 characters
- `email`: Valid email format, unique
- `password`: Minimum 8 characters, must include uppercase, lowercase, number, and special character

### LoginInput

```graphql
input LoginInput {
  email: String!
  password: String!
}
```

### UpdateUserInput

```graphql
input UpdateUserInput {
  name: String
  email: String
}
```

**Notes:**

- All fields optional
- Email must be unique if provided
- Password updates handled separately for security

## Queries

### me

Get current user profile (requires authentication).

```graphql
query GetCurrentUser {
  me {
    id
    name
    email
    role
    createdAt
    lastLoginAt
  }
}
```

**Returns:** `User`  
**Auth Required:** Yes  
**Errors:**

- `Authentication required` - No valid token provided

### user

Get specific user by ID (admin only).

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    role
    createdAt
    lastLoginAt
  }
}
```

**Args:**

- `id` (ID!): User identifier

**Returns:** `User`  
**Auth Required:** Yes (Admin role)  
**Errors:**

- `Authentication required` - No valid token
- `Admin access required` - Insufficient permissions
- `User not found` - Invalid user ID

### users

Get all users (admin only).

```graphql
query GetAllUsers {
  users {
    id
    name
    email
    role
    createdAt
    lastLoginAt
  }
}
```

**Returns:** `[User]`  
**Auth Required:** Yes (Admin role)  
**Errors:**

- `Authentication required` - No valid token
- `Admin access required` - Insufficient permissions

### hello

Simple greeting query for testing.

```graphql
query TestHello {
  hello
}
```

**Returns:** `String` (always "Hello World!")  
**Auth Required:** No

## Mutations

### register

Create a new user account.

```graphql
mutation RegisterUser($input: RegisterInput!) {
  register(input: $input) {
    status
    message
    data {
      id
      name
      email
      role
      authToken
      refreshToken
    }
  }
}
```

**Args:**

- `input` (RegisterInput!): User registration data

**Returns:** `AuthResponse`  
**Auth Required:** No  
**Side Effects:**

- Creates user in database
- Sends welcome email
- Generates auth tokens

**Example:**

```graphql
mutation {
  register(
    input: {
      name: "John Doe"
      email: "john@example.com"
      password: "SecurePass123!"
    }
  ) {
    status
    message
    data {
      id
      authToken
      refreshToken
    }
  }
}
```

### login

Authenticate user and get tokens.

```graphql
mutation LoginUser($input: LoginInput!) {
  login(input: $input) {
    status
    message
    data {
      id
      name
      email
      role
      authToken
      refreshToken
    }
  }
}
```

**Args:**

- `input` (LoginInput!): Login credentials

**Returns:** `AuthResponse`  
**Auth Required:** No  
**Side Effects:**

- Updates last login timestamp
- Generates new auth tokens

**Errors:**

- `Invalid credentials` - Wrong email/password
- `User not found` - Email doesn't exist

### logout

Invalidate current session.

```graphql
mutation LogoutUser {
  logout {
    status
    message
  }
}
```

**Returns:** `ApiResponse`  
**Auth Required:** Yes  
**Side Effects:**

- Invalidates refresh token
- Logs logout event

### updateUser

Update current user profile.

```graphql
mutation UpdateProfile($input: UpdateUserInput!) {
  updateUser(input: $input) {
    status
    message
    data {
      id
      name
      email
      updatedAt
    }
  }
}
```

**Args:**

- `input` (UpdateUserInput!): Updated user data

**Returns:** `ApiResponse`  
**Auth Required:** Yes  
**Side Effects:**

- Updates user record
- Updates timestamp

**Errors:**

- `Authentication required` - No valid token
- `Email already exists` - Duplicate email
- `User not found` - Invalid user ID

### deleteUser

Delete current user account.

```graphql
mutation DeleteAccount {
  deleteUser {
    status
    message
  }
}
```

**Returns:** `ApiResponse`  
**Auth Required:** Yes  
**Side Effects:**

- Soft deletes user record
- Invalidates all tokens
- Sends deletion confirmation email

### refreshToken

Get new access token using refresh token.

```graphql
mutation RefreshAccessToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    status
    message
    data {
      authToken
      refreshToken
    }
  }
}
```

**Args:**

- `refreshToken` (String!): Valid refresh token

**Returns:** `AuthResponse`  
**Auth Required:** No (uses refresh token)  
**Side Effects:**

- Generates new token pair
- Invalidates old refresh token

**Errors:**

- `Invalid refresh token` - Token doesn't exist
- `Refresh token expired` - Token past expiry
- `User not found` - Associated user deleted

### triggerTestSubscription

Trigger test event for subscription testing.

```graphql
mutation TriggerTest($message: String!) {
  triggerTestSubscription(message: $message) {
    id
    message
    timestamp
  }
}
```

**Args:**

- `message` (String!): Custom message for the event

**Returns:** `TestPayload`  
**Auth Required:** No  
**Side Effects:**

- Publishes event to all `testSubscription` subscribers

## Subscriptions

### testSubscription

Subscribe to test events for development and testing.

```graphql
subscription TestEvents {
  testSubscription {
    id
    message
    timestamp
  }
}
```

**Returns:** `TestPayload`  
**Auth Required:** No  
**Trigger:** `triggerTestSubscription` mutation

**Example Usage:**

```javascript
// Client-side subscription
const { data, loading, error } = useSubscription(gql`
  subscription {
    testSubscription {
      id
      message
      timestamp
    }
  }
`);

// Trigger events
const [trigger] = useMutation(gql`
  mutation TriggerTest($message: String!) {
    triggerTestSubscription(message: $message) {
      id
      message
      timestamp
    }
  }
`);
```

## Error Handling

### Standard Error Format

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["me"],
      "extensions": {
        "code": "UNAUTHENTICATED",
        "timestamp": "2025-01-21T10:30:00Z"
      }
    }
  ],
  "data": null
}
```

### Common Error Codes

| Code                  | Description                | Resolution                   |
| --------------------- | -------------------------- | ---------------------------- |
| `UNAUTHENTICATED`     | No authentication provided | Include valid JWT token      |
| `FORBIDDEN`           | Insufficient permissions   | Check user role requirements |
| `BAD_USER_INPUT`      | Invalid input data         | Validate input format        |
| `USER_NOT_FOUND`      | User doesn't exist         | Verify user ID               |
| `EMAIL_EXISTS`        | Email already registered   | Use different email          |
| `INVALID_CREDENTIALS` | Wrong login details        | Check email/password         |
| `TOKEN_EXPIRED`       | Access token expired       | Use refresh token            |
| `INTERNAL_ERROR`      | Server error               | Check server logs            |

## Rate Limiting

GraphQL queries and mutations are subject to rate limiting:

- **Anonymous requests**: 100 requests per 15 minutes
- **Authenticated requests**: 1000 requests per 15 minutes
- **Subscription connections**: 10 per user

## Introspection

Schema introspection is available in development:

```graphql
query GetSchema {
  __schema {
    types {
      name
      description
    }
  }
}
```

**Note:** Introspection is disabled in production for security.

## Examples

### Complete Authentication Flow

```graphql
# 1. Register
mutation Register {
  register(
    input: {
      name: "Alice Smith"
      email: "alice@example.com"
      password: "SecurePass123!"
    }
  ) {
    status
    data {
      id
      authToken
      refreshToken
    }
  }
}

# 2. Get profile
query Profile {
  me {
    id
    name
    email
    role
  }
}

# 3. Update profile
mutation Update {
  updateUser(input: { name: "Alice Johnson" }) {
    status
    data {
      name
      updatedAt
    }
  }
}

# 4. Logout
mutation Logout {
  logout {
    status
    message
  }
}
```

### Real-time Features

```graphql
# Start subscription
subscription RealTime {
  testSubscription {
    id
    message
    timestamp
  }
}

# Trigger events
mutation Trigger1 {
  triggerTestSubscription(message: "First event") {
    id
  }
}

mutation Trigger2 {
  triggerTestSubscription(message: "Second event") {
    id
  }
}
```

## Related Documentation

- [Authentication Guide](/guides/authentication) - JWT implementation details
- [Subscriptions Guide](/guides/subscriptions) - Real-time features
- [API Examples](/api/examples) - Complete code examples
