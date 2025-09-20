# Testing Guide

Comprehensive testing guide for the Express Apollo Server covering unit tests, integration tests, and end-to-end testing.

## Overview

The testing strategy covers:

- **Unit Tests** - Individual functions and components
- **Integration Tests** - API endpoints and database interactions
- **GraphQL Tests** - Schema, resolvers, and subscriptions
- **Authentication Tests** - JWT flows and security
- **Subscription Tests** - Real-time WebSocket functionality

## Testing Stack

- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **graphql-ws** - WebSocket testing for subscriptions
- **@apollo/server/testing** - Apollo Server testing utilities
- **Prisma Test Environment** - Isolated database testing

## Quick Start

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

## Test Structure

```
tests/
├── setup.test.js           # Test environment setup
├── auth/
│   ├── auth.test.js        # Authentication tests
│   ├── jwt.test.js         # JWT utilities tests
│   └── refresh.test.js     # Token refresh tests
├── graphql/
│   ├── queries.test.js     # GraphQL query tests
│   ├── mutations.test.js   # GraphQL mutation tests
│   └── subscriptions.test.js # Subscription tests
├── rest/
│   ├── users.test.js       # User REST endpoints
│   └── analytics.test.js   # Analytics endpoints
└── utils/
    ├── email.test.js       # Email service tests
    └── helpers.test.js     # Utility function tests
```

## Jest Configuration

```javascript
// jest.config.json
{
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.test.js"],
  "testMatch": ["<rootDir>/tests/**/*.test.js"],
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/index.js",
    "!src/config/**",
    "!**/node_modules/**"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"],
  "verbose": true
}
```

## Test Environment Setup

```javascript
// tests/setup.test.js
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

// Setup test database
beforeAll(async () => {
  // Run migrations
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

// Clean database between tests
beforeEach(async () => {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public'
  `;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
});

// Cleanup
afterAll(async () => {
  await prisma.$disconnect();
});

// Test utilities
global.createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: "Test User",
    email: "test@example.com",
    password: "Password123!",
    role: "USER",
  };

  return await prisma.user.create({
    data: { ...defaultUser, ...userData },
  });
};
```

## Authentication Testing

### JWT Token Tests

```javascript
// tests/auth/jwt.test.js
import {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
} from "../../src/utils/jwtUtils.js";

describe("JWT Utils", () => {
  const testUser = {
    id: "test-user-id",
    email: "test@example.com",
    role: "USER",
  };

  describe("generateTokens", () => {
    test("should generate valid access and refresh tokens", () => {
      const tokens = generateTokens(testUser);

      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(typeof tokens.accessToken).toBe("string");
      expect(typeof tokens.refreshToken).toBe("string");
    });
  });

  describe("verifyToken", () => {
    test("should verify valid access token", () => {
      const { accessToken } = generateTokens(testUser);
      const payload = verifyToken(accessToken);

      expect(payload.userId).toBe(testUser.id);
      expect(payload.email).toBe(testUser.email);
      expect(payload.role).toBe(testUser.role);
    });

    test("should reject invalid token", () => {
      expect(() => {
        verifyToken("invalid-token");
      }).toThrow();
    });
  });
});
```

### Authentication Flow Tests

```javascript
// tests/auth/auth.test.js
import request from "supertest";
import app from "../../src/index.js";

describe("Authentication", () => {
  describe("POST /api/auth/register", () => {
    test("should register user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("authToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.email).toBe(userData.email);
    });

    test("should reject duplicate email", async () => {
      // Create user first
      await createTestUser({ email: "existing@example.com" });

      const response = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "existing@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    test("should validate password requirements", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "weak",
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login with valid credentials", async () => {
      const user = await createTestUser();

      const response = await request(app).post("/api/auth/login").send({
        email: user.email,
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("authToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    test("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
    });
  });

  describe("POST /api/auth/refresh", () => {
    test("should refresh tokens successfully", async () => {
      // Register user to get refresh token
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
        });

      const { refreshToken } = registerResponse.body.data;

      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("authToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });
  });
});
```

## GraphQL Testing

### Query Tests

```javascript
// tests/graphql/queries.test.js
import request from "supertest";
import app from "../../src/index.js";

describe("GraphQL Queries", () => {
  describe("me query", () => {
    test("should return current user profile", async () => {
      const user = await createTestUser();
      const { accessToken } = generateTokens(user);

      const query = `
        query {
          me {
            id
            name
            email
            role
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.me).toMatchObject({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    });

    test("should require authentication", async () => {
      const query = `
        query {
          me {
            id
            email
          }
        }
      `;

      const response = await request(app).post("/graphql").send({ query });

      expect(response.body.errors[0].message).toMatch(
        /authentication required/i
      );
    });
  });

  describe("users query", () => {
    test("should return all users for admin", async () => {
      const adminUser = await createTestUser({
        email: "admin@example.com",
        role: "ADMIN",
      });
      const { accessToken } = generateTokens(adminUser);

      // Create additional test users
      await createTestUser({ email: "user1@example.com" });
      await createTestUser({ email: "user2@example.com" });

      const query = `
        query {
          users {
            id
            email
            role
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(3);
    });

    test("should reject non-admin users", async () => {
      const user = await createTestUser({ role: "USER" });
      const { accessToken } = generateTokens(user);

      const query = `
        query {
          users {
            id
            email
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query });

      expect(response.body.errors[0].message).toMatch(/admin access required/i);
    });
  });
});
```

### Mutation Tests

```javascript
// tests/graphql/mutations.test.js
import request from "supertest";
import app from "../../src/index.js";

describe("GraphQL Mutations", () => {
  describe("register mutation", () => {
    test("should register user successfully", async () => {
      const mutation = `
        mutation RegisterUser($input: RegisterInput!) {
          register(input: $input) {
            status
            message
            data {
              id
              name
              email
              authToken
              refreshToken
            }
          }
        }
      `;

      const variables = {
        input: {
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
        },
      };

      const response = await request(app)
        .post("/graphql")
        .send({ query: mutation, variables });

      expect(response.status).toBe(200);
      expect(response.body.data.register.status).toBe("success");
      expect(response.body.data.register.data.authToken).toBeDefined();
    });
  });

  describe("updateUser mutation", () => {
    test("should update user profile", async () => {
      const user = await createTestUser();
      const { accessToken } = generateTokens(user);

      const mutation = `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            status
            data {
              id
              name
              email
            }
          }
        }
      `;

      const variables = {
        input: {
          name: "Updated Name",
        },
      };

      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: mutation, variables });

      expect(response.status).toBe(200);
      expect(response.body.data.updateUser.data.name).toBe("Updated Name");
    });
  });
});
```

## Subscription Testing

```javascript
// tests/graphql/subscriptions.test.js
import { createClient } from "graphql-ws";
import WebSocket from "ws";

describe("GraphQL Subscriptions", () => {
  let client;

  beforeEach(() => {
    client = createClient({
      url: "ws://localhost:4000/graphql",
      webSocketImpl: WebSocket,
      connectionParams: {
        // Add auth token if needed
      },
    });
  });

  afterEach(() => {
    client.dispose();
  });

  test("should receive subscription events", (done) => {
    const subscription = client.iterate({
      query: `
        subscription {
          testSubscription {
            id
            message
            timestamp
          }
        }
      `,
    });

    // Listen for events
    (async () => {
      for await (const result of subscription) {
        expect(result.data.testSubscription).toBeDefined();
        expect(result.data.testSubscription.message).toBe("Test message");
        done();
        break;
      }
    })();

    // Trigger event after short delay
    setTimeout(async () => {
      await request(app)
        .post("/graphql")
        .send({
          query: `
            mutation {
              triggerTestSubscription(message: "Test message") {
                id
              }
            }
          `,
        });
    }, 100);
  });
});
```

## REST API Testing

```javascript
// tests/rest/users.test.js
import request from "supertest";
import app from "../../src/index.js";

describe("User REST Endpoints", () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser();
    const tokens = generateTokens(testUser);
    authToken = tokens.accessToken;
  });

  describe("GET /api/users/profile", () => {
    test("should return user profile", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(testUser.email);
    });

    test("should require authentication", async () => {
      const response = await request(app).get("/api/users/profile");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/users/profile", () => {
    test("should update user profile", async () => {
      const updateData = {
        name: "Updated Name",
      };

      const response = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Updated Name");
    });
  });
});
```

## Email Testing

```javascript
// tests/utils/email.test.js
import { sendEmail, sendWelcomeEmail } from "../../src/email/index.js";
import nodemailer from "nodemailer";

// Mock nodemailer
jest.mock("nodemailer");

describe("Email Service", () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should send welcome email", async () => {
    const user = {
      name: "Test User",
      email: "test@example.com",
    };

    await sendWelcomeEmail(user);

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: expect.stringContaining("Welcome"),
      })
    );
  });

  test("should handle email sending errors", async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error("SMTP Error"));

    const user = {
      name: "Test User",
      email: "test@example.com",
    };

    await expect(sendWelcomeEmail(user)).rejects.toThrow("SMTP Error");
  });
});
```

## Performance Testing

```javascript
// tests/performance/load.test.js
import request from "supertest";
import app from "../../src/index.js";

describe("Performance Tests", () => {
  test("should handle concurrent requests", async () => {
    const requests = Array(50)
      .fill()
      .map(() => request(app).get("/api/health"));

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  test("should respond within acceptable time", async () => {
    const start = Date.now();

    await request(app).get("/api/health");

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // 100ms
  });
});
```

## Coverage and Reports

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```javascript
// jest.config.json coverage settings
{
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/index.js",
    "!src/config/**",
    "!**/node_modules/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Database Testing

- Use separate test database
- Clean data between tests
- Use transactions for isolation
- Mock external services

### Authentication Testing

- Test both positive and negative cases
- Verify token expiration handling
- Test role-based access control
- Mock JWT in unit tests

### Performance Testing

- Set reasonable response time expectations
- Test concurrent request handling
- Monitor memory usage
- Test with realistic data volumes

## Troubleshooting

### Common Issues

**Database Connection Errors**

```bash
# Ensure test database exists
createdb express_apollo_test

# Run migrations
DATABASE_URL="postgresql://localhost:5432/express_apollo_test" npx prisma migrate deploy
```

**Token Expiry in Tests**

```javascript
// Use longer-lived tokens for testing
const generateTestToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Longer expiry for tests
  );
};
```

**WebSocket Connection Issues**

```javascript
// Ensure server is running before WebSocket tests
beforeAll(async () => {
  await new Promise((resolve) => {
    server.listen(0, resolve);
  });
});
```

## Next Steps

- [Authentication Guide](/guides/authentication) - Understand auth implementation
- [GraphQL API](/api/graphql/schema) - Explore the complete schema
- [Getting Started](/guides/) - Set up development environment
