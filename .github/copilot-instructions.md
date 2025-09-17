# Copilot Instructions for AI Agents

## Project Overview

This Node.js backend serves both REST and GraphQL APIs, supporting real-time features via PubSub. The architecture is modular, separating Express and GraphQL logic, and follows best practices for security, error handling, and performance.

## Key Technologies

- Node.js (latest LTS)
- Express (REST API, middleware)
- Apollo Server (GraphQL API, subscriptions)
- Prisma (ORM, PostgreSQL)
- Winston (logging)
- Nodemailer (email via SMTP)
- JWT (authentication, refresh tokens)
- bcrypt (password hashing)
- express-rate-limit, CORS, dotenv, Joi (validation)
- Jest (testing)

## Folder Structure

- `src/express/` — REST controllers, routes, services, middlewares
- `src/graphql/` — schema, resolvers, pubsub
- `src/prisma/` — Prisma schema, migrations, client
- `src/config/` — logger, email, environment config
- `src/utils/` — helpers (JWT, error handling)
- `src/index.js` — entry point, integrates Express and Apollo
- Root: `package.json`, `.env.example`, `README.md`

## Developer Workflows

- **Start server:** Use `src/index.js` to launch both Express and Apollo (GraphQL on `/graphql`, REST on `/api`).
- **Database:** Run Prisma migrations before starting (`npx prisma migrate dev`).
- **Testing:** Use Jest for unit/integration tests.
- **Environment:** Configure secrets and credentials in `.env` (see `.env.example`).

## Patterns & Conventions

- **Authentication:** JWT for both REST and GraphQL. Use Express middleware for REST, Apollo context for GraphQL.
- **RBAC:** Role-based access via middleware (`roleMiddleware.js`).
- **Logging:** Use Winston, with file rotation and console output. Global logging middleware.
- **Error Handling:** Centralized error handler in Express and GraphQL.
- **Rate Limiting:** Use `express-rate-limit` globally.
- **Analytics:** `/analytics` REST endpoint renders HTML with API metrics and logs.
- **PubSub:** Apollo PubSub for subscriptions (in-memory; suggest Redis for production).
- **Password Security:** Hash with bcrypt, validate with Joi.
- **Email:** Nodemailer, SMTP config via environment variables.

## Integration Points

- **Prisma:** All DB access via Prisma client. User model includes fields for tokens and roles.
- **Nodemailer:** Used for verification and password reset emails.
- **REST & GraphQL:** Both APIs share authentication and user logic, but are implemented in separate folders.

## Example File References

- `src/express/controllers/authController.js` — REST auth logic
- `src/graphql/resolvers/mutations.js` — GraphQL mutations (login, signup)
- `src/prisma/schema.prisma` — DB schema
- `src/config/logger.js` — Winston setup
- `src/utils/jwtUtils.js` — JWT helpers

## Special Notes

- Use async/await for all async operations.
- Prefer modular, testable code.
- For production, consider Redis for PubSub and token blacklisting.
- Analytics endpoint should display recent logs and API metrics.
