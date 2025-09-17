# Express Apollo Server

A full-featured Node.js backend that serves both REST and GraphQL APIs, with real-time features via PubSub.

## Features

- REST API with Express
- GraphQL API with Apollo Server
- Database access with Prisma ORM
- Authentication and authorization with JWT
- Real-time subscriptions with PubSub
- Email functionality with Nodemailer
- Comprehensive logging with Winston
- Rate limiting and CORS protection
- Analytics dashboard

## Prerequisites

- Node.js (Latest LTS version recommended)
- PostgreSQL database
- SMTP server for email functionality

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

5. Run Prisma migrations to set up the database:

```bash
npm run prisma:migrate
```

## Development

Start the development server with auto-reload:

```bash
npm run dev
```

Access the endpoints:

- REST API: http://localhost:4000/api
- GraphQL Playground: http://localhost:4000/graphql
- Analytics Dashboard: http://localhost:4000/analytics

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server with auto-reload (nodemon)
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma database UI
- `npm test` - Run tests
- `npm run lint` - Check code quality with ESLint

## Project Structure

- `src/express/` — REST controllers, routes, services, middlewares
- `src/graphql/` — schema, resolvers, pubsub
- `src/prisma/` — Prisma schema, migrations, client
- `src/config/` — logger, email, environment config
- `src/utils/` — helpers (JWT, error handling)
- `src/index.js` — entry point, integrates Express and Apollo

## API Endpoints

### REST API

- **Authentication:**

  - POST `/api/auth/register` - Register a new user
  - POST `/api/auth/login` - Login and get JWT token
  - POST `/api/auth/refresh` - Refresh JWT token
  - POST `/api/auth/logout` - Logout and invalidate token

- **User Management:**

  - GET `/api/users` - Get all users (admin only)
  - GET `/api/users/:id` - Get user by ID
  - PUT `/api/users/:id` - Update user
  - DELETE `/api/users/:id` - Delete user

- **Analytics:**
  - GET `/api/analytics` - View API metrics and logs

### GraphQL API

- **Queries:**

  - `users` - Get all users
  - `user(id: ID!)` - Get user by ID

- **Mutations:**

  - `register(input: RegisterInput!)` - Register a new user
  - `login(email: String!, password: String!)` - Login and get JWT token
  - `updateUser(id: ID!, input: UpdateUserInput!)` - Update user
  - `deleteUser(id: ID!)` - Delete user

- **Subscriptions:**
  - `userCreated` - Real-time notification when a new user is created
  - `userUpdated` - Real-time notification when a user is updated

## Testing

Run tests with Jest:

```bash
npm test
```

## License

MIT
