# Getting Started

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- npm or yarn

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Neumao/express-apollo-server.git
cd express-apollo-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Server
PORT=4000
NODE_ENV="development"
```

### 4. Database Setup

Run Prisma migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

Your server will be running at:

- 🌐 REST API: `http://localhost:4000/api`
- 🎯 GraphQL Playground: `http://localhost:4000/graphql`
- 🔌 WebSocket: `ws://localhost:4000/graphql`

## Development Workflow

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Production build
npm start

# Run tests
npm test

# Database operations
npm run db:reset    # Reset database
npm run db:migrate  # Run migrations
npm run db:seed     # Seed data

# Code quality
npm run lint        # ESLint
npm run format      # Prettier
```

### Project Structure

```
src/
├── index.js               # Application entry point
├── config/                # Configuration files
│   ├── env.js            # Environment variables
│   └── logger.js         # Winston logging setup
├── express/              # Express.js REST API
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Express middleware
│   ├── routes/           # Route definitions
│   └── services/         # Business logic services
├── graphql/              # GraphQL implementation
│   ├── resolvers/        # Domain-based resolvers
│   │   ├── user/         # User domain (auth, profile)
│   │   └── base/         # Base functionality
│   ├── schema/           # GraphQL type definitions
│   ├── context.js        # GraphQL context setup
│   └── server.js         # Apollo Server configuration
├── email/                # Email system
│   ├── templates/        # Handlebars templates
│   ├── templates.js      # Template helpers
│   └── index.js          # Email service
└── utils/                # Shared utilities
    ├── jwtUtils.js       # JWT token management
    ├── errors.js         # Error definitions
    └── response.js       # Response helpers
```

## First API Call

### REST API Example

```bash
# Register a new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### GraphQL Example

```graphql
# In Apollo Studio (http://localhost:4000/graphql)
mutation RegisterUser {
  register(
    input: {
      name: "John Doe"
      email: "john@example.com"
      password: "password123"
    }
  ) {
    status
    message
    data {
      id
      name
      email
    }
  }
}
```

## Testing Your Setup

1. **Health Check**: Visit `http://localhost:4000/api/health`
2. **GraphQL Playground**: Open `http://localhost:4000/graphql`
3. **Analytics Dashboard**: Check `http://localhost:4000/api/analytics`

## Next Steps

- [Analytics Guide](/guides/analytics) - Monitor API performance and metrics
- [Authentication Guide](/guides/authentication) - Learn about JWT authentication
- [GraphQL API](/api/graphql/schema) - Explore the GraphQL schema
- [Subscriptions Guide](/guides/subscriptions) - Set up real-time features
- [Testing Guide](/guides/testing) - Run and write tests

## Troubleshooting

### Common Issues

**Database Connection Error**

```
Error: P1001: Can't reach database server
```

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

**Port Already in Use**

```
Error: listen EADDRINUSE :::4000
```

- Change PORT in .env file
- Kill process using port: `lsof -ti:4000 | xargs kill`

**JWT Secret Missing**

```
Error: JWT_SECRET is required
```

- Set JWT_SECRET in .env file
- Use a strong, random string

### Getting Help

- Check the [FAQ](/guides/faq)
- Review [error logs](/guides/logging)
- Open an [issue](https://github.com/Neumao/express-apollo-server/issues)
