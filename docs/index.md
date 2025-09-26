# Express Apollo Server

<div class="hero">
  <h1>Complete Node.js Backend</h1>
  <p>Express REST API + Apollo GraphQL with Real-time Subscriptions</p>
</div>

## 🚀 Features

- **🔥 Apollo Server v5** - Modern GraphQL server with native subscriptions
- **⚡ Express.js** - Fast, unopinionated web framework
- **🔐 JWT Authentication** - Secure authentication with refresh tokens
- **📡 Real-time Subscriptions** - WebSocket-based GraphQL subscriptions
- **🗄️ Prisma ORM** - Type-safe database access with PostgreSQL
- **🏗️ Domain-based Architecture** - Organized by business domains
- **📧 Email System** - Nodemailer with Handlebars templates
- **📊 Analytics** - Built-in API metrics and logging
- **📊 Advanced Monitoring** - Real-time dashboard with performance insights
- **📋 API Analytics** - Endpoint performance analysis and rate limiting
- **📝 System Logs** - Comprehensive logging with Winston
- **🧪 Testing** - Jest testing framework
- **📝 Comprehensive Logging** - Winston with file rotation

## 🎯 Tech Stack

| Category           | Technology                   |
| ------------------ | ---------------------------- |
| **Backend**        | Node.js, Express.js          |
| **GraphQL**        | Apollo Server v5, graphql-ws |
| **Database**       | PostgreSQL, Prisma ORM       |
| **Authentication** | JWT, bcrypt                  |
| **Real-time**      | WebSocket Subscriptions      |
| **Email**          | Nodemailer, Handlebars       |
| **Logging**        | Winston                      |
| **Testing**        | Jest                         |
| **Documentation**  | VitePress                    |

## 🏗️ Architecture

```
src/
├── express/           # REST API endpoints
│   ├── controllers/   # Route handlers
│   ├── middleware/    # Express middleware
│   ├── routes/        # Route definitions
│   └── services/      # Business logic
├── graphql/           # GraphQL implementation
│   ├── resolvers/     # Domain-based resolvers
│   │   ├── user/      # User domain
│   │   └── base/      # Common functionality
│   ├── schema/        # GraphQL schemas
│   └── pubsub/        # Subscription system
├── config/            # Configuration
├── email/             # Email templates & logic
└── utils/             # Shared utilities
```

## 📚 Quick Links

### 🔧 Development

- [**Getting Started**](/guides/) - Set up your development environment
- [**Analytics Guide**](/guides/analytics) - Monitor API performance and metrics
- [**Authentication Guide**](/guides/authentication) - JWT implementation details
- [**Testing Guide**](/guides/testing) - Running tests and examples

### 📖 API Reference

- [**GraphQL API**](/api/graphql/schema) - Complete GraphQL schema documentation
- [**REST API**](/api/rest/authentication) - Express.js endpoints
- [**Analytics API**](/api/rest/analytics) - API monitoring and metrics
- [**Subscriptions**](/api/graphql/subscriptions) - Real-time features

### 🏛️ Architecture

- [**Domain Structure**](/architecture/domain-structure) - How code is organized
- [**Database Schema**](/architecture/database) - Prisma models and relationships
- [**Security**](/architecture/security) - Authentication and authorization

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Neumao/express-apollo-server.git
cd express-apollo-server

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Server runs on:
# 📡 REST API: http://localhost:4000/api
# 🎯 GraphQL: http://localhost:4000/graphql
# 🔌 WebSocket: ws://localhost:4000/graphql
```

## 📊 API Endpoints

| Type      | Endpoint                   | Description                   |
| --------- | -------------------------- | ----------------------------- |
| GraphQL   | `/graphql`                 | Main GraphQL endpoint         |
| WebSocket | `/graphql`                 | GraphQL subscriptions         |
| REST      | `/api/auth/*`              | Authentication endpoints      |
| REST      | `/api/users/*`             | User management               |
| REST      | `/api/analytics`           | Analytics dashboard (HTML)    |
| REST      | `/api/analytics/api`       | Detailed API analytics (HTML) |
| REST      | `/api/analytics/logs`      | System logs viewer (HTML)     |
| REST      | `/api/analytics/metrics`   | System metrics (JSON)         |
| REST      | `/api/analytics/users`     | User analytics (JSON)         |
| REST      | `/api/analytics/dashboard` | Dashboard data (JSON)         |

## 🔐 Authentication Flow

1. **Register/Login** → Get access token (15 min) + refresh token (7 days)
2. **API Requests** → Include `Authorization: Bearer <token>`
3. **Token Expires** → Automatically refreshed using refresh token
4. **WebSocket** → Authentication via connection params

## 🎮 Interactive Examples

Try these queries in Apollo Studio at `http://localhost:4000/graphql`:

```graphql
# Login
mutation {
  login(input: { email: "user@example.com", password: "password" }) {
    status
    message
    data {
      id
      email
      authToken
    }
  }
}

# Real-time subscription
subscription {
  testSubscription {
    id
    message
    timestamp
  }
}
```

## 📞 Support

- 📧 Email: [support@example.com](mailto:support@example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/Neumao/express-apollo-server/issues)
- 📚 Documentation: [Full Docs](/guides/)

---

<div style="text-align: center; margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
  <strong>🚀 Production-Ready Backend</strong><br>
  Express + Apollo GraphQL + Real-time Subscriptions
</div>
