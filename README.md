# Express Apollo Server 🚀

<div align="center">

**Production-Ready Node.js Backend with REST + GraphQL + Real-time Subscriptions**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Apollo Server](https://img.shields.io/badge/Apollo%20Server-v5-blue.svg)](https://www.apollographql.com/docs/apollo-server/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098.svg)](https://graphql.org/)
[![Express](https://img.shields.io/badge/Express.js-Fast-lightgrey.svg)](https://expressjs.com/)

[📚 Documentation](https://express-apollo-server.netlify.app/) • [🎯 GraphQL Playground](http://localhost:4000/graphql) • [📊 API Analytics](http://localhost:4000/api/analytics)

</div>

## ✨ Features

🔥 **Modern GraphQL Server**

- Apollo Server v5 with native subscriptions
- Real-time WebSocket communication
- Automatic schema validation and introspection

🛡️ **Robust Authentication**

- JWT with automatic refresh tokens (15min/7day cycle)
- WebSocket authentication for subscriptions
- Role-based access control (USER/ADMIN/MODERATOR)

⚡ **High-Performance REST API**

- Express.js with comprehensive middleware
- Rate limiting and CORS protection
- Built-in analytics dashboard

🗄️ **Type-Safe Database**

- Prisma ORM with PostgreSQL
- Automatic migrations and schema validation
- Optimized queries with relation loading

🏗️ **Domain-Driven Architecture**

- Organized by business domains (user/, base/)
- Scalable resolver structure
- Clear separation of concerns

� **Advanced Analytics & Monitoring**

- Real-time API metrics dashboard with interactive charts
- Endpoint performance analysis with response time tracking
- Rate limiting monitoring and usage statistics
- Comprehensive logging with Winston (application, error, exceptions)
- API request tracking with detailed metadata
- Performance insights and optimization recommendations

�📧 **Email System**

- Handlebars templates (welcome, password reset)
- SMTP configuration with fallback
- Automated notification workflows

�️ **Production Features**

- Winston logging with file rotation
- Comprehensive error handling
- Health checks and monitoring
- Jest testing framework

## 🎯 Quick Demo

```bash
# 🚀 One-command setup
git clone https://github.com/Neumao/express-apollo-server.git
cd express-apollo-server && npm install && cp .env.example .env
npx prisma migrate dev && npm run dev

# ✅ Server running at http://localhost:4000
# 🎮 GraphQL Playground: http://localhost:4000/graphql
# 📊 Analytics Dashboard: http://localhost:4000/api/analytics
```

## 🏗️ Architecture Overview

```mermaid
graph TB
    Client[Client Apps] --> LB[Load Balancer]
    LB --> Server[Express + Apollo Server]

    Server --> GraphQL[GraphQL Endpoint<br/>/graphql]
    Server --> REST[REST API<br/>/api/*]
    Server --> WS[WebSocket<br/>Subscriptions]

    GraphQL --> Auth[JWT Auth<br/>Middleware]
    REST --> Auth
    WS --> Auth

    Auth --> Resolvers[Domain Resolvers]
    Resolvers --> User[User Domain<br/>auth, profile]
    Resolvers --> Base[Base Domain<br/>core, testing]

    User --> Prisma[Prisma ORM]
    Base --> Prisma
    Prisma --> DB[(PostgreSQL<br/>Database)]

    Server --> Email[Email Service<br/>SMTP + Templates]
    Server --> Logs[Winston Logging<br/>Files + Console]
```

### 📂 Project Structure

```
src/
├── 🎯 index.js                 # Application entry point
├── ⚙️ config/                  # Configuration & environment
├── 🌐 express/                 # REST API layer
│   ├── 🎮 controllers/         # Route handlers
│   │   ├── analytics/         # Analytics controllers
│   │   └── auth/              # Authentication controllers
│   ├── 🛡️ middleware/          # Auth, logging, errors, API tracking
│   ├── 🛣️ routes/              # API endpoints
│   └── 🔧 services/            # Business logic
│       └── analyticsService.js # Analytics data processing
├── 📡 graphql/                 # GraphQL implementation
│   ├── 🏗️ resolvers/           # Domain-based resolvers
│   │   ├── 👤 user/            # User domain (auth, profile)
│   │   └── ⚡ base/            # Core functionality
│   ├── 📋 schema/              # Type definitions
│   └── 🔌 pubsub/              # Real-time subscriptions
├── 📧 email/                   # Email templates & service
├── 🗄️ prisma/                  # Database schema & client
├── 📊 templates/               # Handlebars templates
│   ├── analytics-dashboard.hbs # Main analytics dashboard
│   ├── api-analytics.hbs       # Detailed API analytics
│   └── logs.hbs                # System logs viewer
└── 🛠️ utils/                   # Shared utilities
```

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js 18+** (LTS recommended)
- **PostgreSQL 14+**
- **npm/yarn**

### ⚡ Installation

```bash
# 1️⃣ Clone repository
git clone https://github.com/Neumao/express-apollo-server.git
cd express-apollo-server

# 2️⃣ Install dependencies
npm install

# 3️⃣ Environment setup
cp .env.example .env
# Edit .env with your database URL, JWT secrets, etc.

# 4️⃣ Database setup
npx prisma generate
npx prisma migrate dev

# 5️⃣ Start development server
npm run dev
```

### 🎮 Try It Out

**REST API Example:**

```bash
# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123!"}'
```

**GraphQL Example:**

```graphql
# In Apollo Playground (http://localhost:4000/graphql)
mutation {
  register(
    input: {
      name: "Jane Smith"
      email: "jane@example.com"
      password: "SecurePass123!"
    }
  ) {
    data {
      id
      name
      authToken
    }
  }
}
```

**Real-time Subscriptions:**

```graphql
# Subscribe to events
subscription {
  testSubscription {
    id
    message
    timestamp
  }
}

# Trigger events (in another tab)
mutation {
  triggerTestSubscription(message: "Hello Real-time!") {
    id
    timestamp
  }
}
```

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB

    Client->>Server: 1. Register/Login
    Server->>DB: Verify credentials
    DB-->>Server: User data
    Server-->>Client: 2. Access Token (15min) + Refresh Token (7d)

    Note over Client: Making authenticated requests

    Client->>Server: 3. API Request + Token
    Server->>Server: Verify token
    Server-->>Client: 4. Protected data

    Note over Client: Token expires

    Client->>Server: 5. Request with expired token
    Server-->>Client: 6. 401 Unauthorized
    Client->>Server: 7. Refresh token request
    Server->>DB: Validate refresh token
    Server-->>Client: 8. New token pair
```

**Features:**

- 🔑 **JWT Access Tokens** (15-minute expiry)
- 🔄 **Automatic Refresh** (7-day refresh tokens)
- 🌐 **WebSocket Auth** (Connection-level authentication)
- 👥 **Role-Based Access** (USER/ADMIN/MODERATOR)

## 📡 Real-time Subscriptions

Built on **Apollo Server v5** native subscriptions with WebSocket authentication:

```javascript
// Client setup with authentication
import { createClient } from "graphql-ws";

const wsClient = createClient({
  url: "ws://localhost:4000/graphql",
  connectionParams: () => ({
    authorization: `Bearer ${getToken()}`,
  }),
});
```

**Available Subscriptions:**

- 🧪 `testSubscription` - Development testing
- 👤 `userUpdated` - User profile changes (planned)
- 📢 `notifications` - Real-time notifications (planned)

## � Analytics Dashboard

Comprehensive API monitoring and analytics with real-time metrics:

**Dashboard Features:**

- 📈 **Real-time Metrics** - Total requests, response times, success rates
- 📊 **Interactive Charts** - Status codes, HTTP methods, endpoint performance
- 🔍 **Detailed Analytics** - Endpoint-by-endpoint performance analysis
- 📋 **Request Logs** - Recent API requests with full metadata
- ⚡ **Rate Limiting** - Current usage and limits monitoring
- 📝 **System Logs** - Application, error, and exception logs

**Access Dashboard:**

```
🌐 http://localhost:4000/api/analytics          # Main Dashboard
🌐 http://localhost:4000/api/analytics/api       # Detailed API Analytics
🌐 http://localhost:4000/api/analytics/logs      # System Logs Viewer
```

**Analytics Endpoints:**

```bash
# Get system metrics (JSON)
GET /api/analytics/metrics

# Get user analytics
GET /api/analytics/users?timeRange=24h&limit=10

# Get dashboard data
GET /api/analytics/dashboard
```

## �🛠️ Development

### 🧪 Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### 📊 Available Scripts

```bash
npm run dev             # 🔥 Development with hot reload
npm start               # 🚀 Production server
npm run seed            # 🌱 Seed database with test data
npm run db:reset        # 🔄 Reset database
npm run lint            # 🔍 ESLint code analysis
npm run format          # ✨ Prettier code formatting
```

### 🔧 Environment Variables

```env
# 🗄️ Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# 🔐 JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# 📧 Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# ⚙️ Server
PORT=4000
NODE_ENV="development"
```

## 🎯 API Reference

### 🌐 REST Endpoints

| Method | Endpoint             | Description       | Auth |
| ------ | -------------------- | ----------------- | ---- |
| `POST` | `/api/auth/register` | User registration | ❌   |
| `POST` | `/api/auth/login`    | User login        | ❌   |
| `POST` | `/api/auth/refresh`  | Refresh tokens    | ❌   |
| `POST` | `/api/auth/logout`   | User logout       | ✅   |
| `GET`  | `/api/users/profile` | Get profile       | ✅   |
| `PUT`  | `/api/users/profile` | Update profile    | ✅   |
| `GET`  | `/api/analytics`     | API dashboard     | ❌   |

### 📡 GraphQL Operations

**🔍 Queries:**

- `me` - Current user profile
- `user(id)` - Specific user (admin)
- `users` - All users (admin)
- `hello` - Health check

**✏️ Mutations:**

- `register(input)` - User registration
- `login(input)` - Authentication
- `logout` - End session
- `updateUser(input)` - Update profile
- `deleteUser` - Delete account
- `refreshToken(token)` - Token refresh
- `triggerTestSubscription(message)` - Test events

**📡 Subscriptions:**

- `testSubscription` - Real-time test events

## 🚀 Production Deployment

### 🐳 Docker Support

```dockerfile
# Dockerfile included
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
EXPOSE 4000
CMD ["npm", "start"]
```

### ☁️ Environment Setup

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL="your-production-db-url"
JWT_SECRET="production-jwt-secret"
PORT=4000
```

### 🔧 Recommended Stack

- **Hosting**: Railway, Vercel, AWS ECS
- **Database**: Railway PostgreSQL, AWS RDS
- **Monitoring**: DataDog, LogRocket
- **CDN**: CloudFlare
- **SSL**: Let's Encrypt

## 📚 Documentation

📖 **[Complete Documentation](https://express-apollo-server.netlify.app/)**

- 🚀 [**Getting Started**](https://express-apollo-server.netlify.app/guides/) - Setup and development
- 🔐 [**Authentication Guide**](https://express-apollo-server.netlify.app/guides/authentication) - JWT implementation
- 📡 [**Subscriptions Guide**](https://express-apollo-server.netlify.app/guides/subscriptions) - Real-time features
- 📖 [**GraphQL API**](https://express-apollo-server.netlify.app/api/graphql/schema) - Complete schema reference
- 🏗️ [**Architecture**](https://express-apollo-server.netlify.app/architecture/domain-structure) - Domain structure guide

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- 🚀 [**Apollo GraphQL**](https://www.apollographql.com/) - Excellent GraphQL server
- 🗄️ [**Prisma**](https://www.prisma.io/) - Amazing type-safe ORM
- ⚡ [**Express.js**](https://expressjs.com/) - Fast, minimalist web framework
- 🎯 [**GraphQL**](https://graphql.org/) - Query language for APIs

---

<div align="center">

**⭐ Star this repo if it helped you build something awesome!**

[📚 Documentation](https://express-apollo-server.netlify.app/) • [🐛 Report Bug](https://github.com/Neumao/express-apollo-server/issues) • [💡 Feature Request](https://github.com/Neumao/express-apollo-server/discussions)

</div>
