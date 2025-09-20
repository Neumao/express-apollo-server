# Domain-Based Architecture

This document explains the domain-based architecture used to organize the GraphQL resolvers and overall codebase structure.

## Overview

The codebase follows a **domain-driven design** approach, organizing code by business domains rather than technical layers. This improves maintainability, scalability, and team collaboration.

## Architecture Principles

### 1. Domain Separation

Code is organized by business domains (User, Product, Order, etc.) rather than by technical layers (controllers, services, models).

### 2. Clear Boundaries

Each domain has well-defined boundaries and responsibilities, minimizing cross-domain dependencies.

### 3. Scalable Structure

New features can be added by extending existing domains or creating new ones without affecting other parts of the system.

### 4. Team Ownership

Different teams can own different domains, enabling parallel development and clear ownership.

## Current Domain Structure

```
src/
├── graphql/
│   └── resolvers/
│       ├── index.js           # Main resolver aggregator
│       ├── typeResolvers.js   # Type-specific resolvers
│       ├── user/              # User Domain
│       │   ├── index.js       # Domain entry point
│       │   ├── queries.js     # User queries (me, user, users)
│       │   └── mutations.js   # User mutations (register, login, etc.)
│       └── base/              # Base/Core Domain
│           ├── index.js       # Domain entry point
│           ├── queries.js     # Base queries (hello)
│           ├── mutations.js   # Base mutations (triggerTest)
│           └── subscriptions.js # Base subscriptions (testSubscription)
```

## Domain Definitions

### User Domain (`user/`)

**Purpose**: Handles all user-related functionality including authentication, profile management, and user operations.

**Responsibilities:**

- User registration and authentication
- Profile management (view, update, delete)
- User listing and retrieval (admin functions)
- JWT token management

**Resolvers:**

- **Queries**: `me`, `user`, `users`
- **Mutations**: `register`, `login`, `logout`, `updateUser`, `deleteUser`, `refreshToken`
- **Subscriptions**: None currently (planned: user events)

### Base Domain (`base/`)

**Purpose**: Provides core functionality, utilities, and features that don't belong to specific business domains.

**Responsibilities:**

- Health checks and testing utilities
- System-wide events and notifications
- Cross-domain functionality
- Development and debugging tools

**Resolvers:**

- **Queries**: `hello`
- **Mutations**: `triggerTestSubscription`
- **Subscriptions**: `testSubscription`

## Implementation Details

### Resolver Index Structure

```javascript
// graphql/resolvers/index.js
import userResolvers from "./user/index.js";
import baseResolvers from "./base/index.js";
import typeResolvers from "./typeResolvers.js";

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...baseResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...baseResolvers.Mutation,
  },
  Subscription: {
    ...userResolvers.Subscription,
    ...baseResolvers.Subscription,
  },
  ...typeResolvers,
};

export default resolvers;
```

### Domain Entry Points

Each domain has an `index.js` file that exports all resolvers for that domain:

```javascript
// graphql/resolvers/user/index.js
import * as queries from "./queries.js";
import * as mutations from "./mutations.js";

export default {
  Query: queries,
  Mutation: mutations,
  Subscription: {}, // Future user subscriptions
};
```

### Resolver Organization

Within each domain, resolvers are organized by GraphQL operation type:

```javascript
// graphql/resolvers/user/queries.js
import { prisma } from "../../../prisma/client.js";

export const me = async (parent, args, context) => {
  if (!context.user) {
    throw new Error("Authentication required");
  }
  return context.user;
};

export const user = async (parent, { id }, context) => {
  if (!context.user || context.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const users = async (parent, args, context) => {
  if (!context.user || context.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
};
```

## Benefits of Domain-Based Architecture

### 1. Improved Maintainability

- **Logical Organization**: Related functionality is grouped together
- **Easier Navigation**: Developers can quickly find relevant code
- **Reduced Cognitive Load**: Smaller, focused files are easier to understand

### 2. Better Scalability

- **Parallel Development**: Teams can work on different domains simultaneously
- **Independent Deployment**: Domains can potentially be deployed separately
- **Feature Isolation**: New features don't affect unrelated domains

### 3. Enhanced Testing

- **Domain-Specific Tests**: Tests can focus on specific business logic
- **Isolated Testing**: Domains can be tested independently
- **Clear Test Organization**: Test structure mirrors code structure

### 4. Team Collaboration

- **Clear Ownership**: Teams can own specific domains
- **Reduced Conflicts**: Less merge conflicts in version control
- **Specialized Knowledge**: Teams can develop deep expertise in their domains

## Migration from Type-Based Structure

The project was migrated from a type-based structure to domain-based:

### Before (Type-Based)

```
resolvers/
├── queries.js      # All queries mixed together
├── mutations.js    # All mutations mixed together
└── subscriptions.js # All subscriptions mixed together
```

### After (Domain-Based)

```
resolvers/
├── user/
│   ├── queries.js    # User-specific queries
│   └── mutations.js  # User-specific mutations
└── base/
    ├── queries.js    # Base queries
    ├── mutations.js  # Base mutations
    └── subscriptions.js # Base subscriptions
```

### Migration Benefits

- **Better Organization**: Related resolvers are now grouped logically
- **Easier Maintenance**: Changes to user functionality only affect user domain
- **Clearer Dependencies**: Domain boundaries make dependencies explicit
- **Future-Proof**: Structure supports adding new domains easily

## Adding New Domains

### 1. Create Domain Directory

```bash
mkdir src/graphql/resolvers/product
```

### 2. Create Resolver Files

```javascript
// src/graphql/resolvers/product/queries.js
export const product = async (parent, { id }, context) => {
  // Implementation
};

export const products = async (parent, args, context) => {
  // Implementation
};
```

```javascript
// src/graphql/resolvers/product/mutations.js
export const createProduct = async (parent, { input }, context) => {
  // Implementation
};

export const updateProduct = async (parent, { id, input }, context) => {
  // Implementation
};
```

### 3. Create Domain Index

```javascript
// src/graphql/resolvers/product/index.js
import * as queries from "./queries.js";
import * as mutations from "./mutations.js";

export default {
  Query: queries,
  Mutation: mutations,
  Subscription: {},
};
```

### 4. Update Main Resolver Index

```javascript
// src/graphql/resolvers/index.js
import productResolvers from "./product/index.js";

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...baseResolvers.Query,
    ...productResolvers.Query, // Add new domain
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...baseResolvers.Mutation,
    ...productResolvers.Mutation, // Add new domain
  },
  // ...
};
```

## Best Practices

### 1. Domain Boundaries

- Keep domains focused on specific business concerns
- Minimize cross-domain dependencies
- Use clear, business-oriented domain names

### 2. File Organization

- Use consistent file naming across domains
- Group related functionality within domains
- Keep individual files focused and small

### 3. Resolver Naming

- Use descriptive, action-oriented names
- Follow GraphQL naming conventions
- Be consistent across domains

### 4. Error Handling

- Implement domain-specific error handling
- Use consistent error messages and codes
- Handle authorization at the domain level

### 5. Testing Strategy

- Write domain-specific test suites
- Test domains in isolation
- Use integration tests for cross-domain functionality

## Future Considerations

### Microservices Evolution

The domain-based structure supports evolution to microservices:

- Each domain could become a separate service
- Clear boundaries make service extraction easier
- API contracts are already well-defined

### Schema Federation

Domains can be evolved into federated GraphQL schemas:

- Each domain could have its own schema
- Apollo Federation could combine schemas
- Teams could own their domain schemas independently

### Event-Driven Architecture

Domains can communicate via events:

- Domain events for cross-domain communication
- Event sourcing for audit trails
- CQRS for read/write separation

## Related Documentation

- [GraphQL Schema](/api/graphql/schema) - Complete schema documentation
- [Getting Started](/guides/) - Project setup and development
- [Testing Guide](/guides/testing) - Testing domain-based code
