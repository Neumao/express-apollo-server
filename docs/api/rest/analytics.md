# Analytics API

<div class="hero">
  <h1>📊 Analytics REST API</h1>
  <p>API monitoring and metrics endpoints</p>
</div>

## Overview

The Analytics API provides comprehensive monitoring and metrics for your API usage, performance, and system health. All analytics endpoints require admin authentication.

## Authentication

All analytics endpoints require admin role authentication:

```bash
Authorization: Bearer <admin-jwt-token>
```

## Endpoints

### GET /api/analytics

**Dashboard HTML Page**

Returns the main analytics dashboard with interactive charts and metrics.

**Response:** HTML page with embedded charts and data

---

### GET /api/analytics/api

**Detailed API Analytics HTML Page**

Returns detailed API analytics with endpoint performance analysis.

**Query Parameters:**

- `timeRange` (string): Time range filter
  - `1h` - Last hour
  - `24h` - Last 24 hours (default)
  - `7d` - Last 7 days
  - `30d` - Last 30 days

**Response:** HTML page with detailed analytics

---

### GET /api/analytics/logs

**System Logs HTML Page**

Returns system logs viewer with filtering capabilities.

**Query Parameters:**

- `logType` (string): Log type filter
  - `application` - Application logs (default)
  - `error` - Error logs
  - `exceptions` - Exception logs
  - `rejections` - Promise rejection logs
- `limit` (number): Number of entries (default: 100)

**Response:** HTML page with log viewer

---

### GET /api/analytics/metrics

**System Metrics JSON**

Returns current system metrics and health data.

**Response:**

```json
{
  "status": true,
  "message": "System metrics fetched successfully",
  "data": {
    "uptime": 3600,
    "memory": {
      "used": 150000000,
      "total": 1000000000,
      "percentage": 15
    },
    "cpu": {
      "usage": 25.5
    },
    "database": {
      "connections": 5,
      "status": "healthy"
    }
  }
}
```

---

### GET /api/analytics/users

**User Analytics JSON**

Returns user activity and analytics data.

**Query Parameters:**

- `timeRange` (string): Time range (default: "24h")
- `limit` (number): Number of results (default: 10)

**Response:**

```json
{
  "status": true,
  "message": "User analytics fetched successfully",
  "data": {
    "totalUsers": 150,
    "activeUsers": 45,
    "topUsers": [
      {
        "userId": "uuid-123",
        "email": "user@example.com",
        "requestCount": 1250,
        "lastActivity": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### GET /api/analytics/dashboard

**Dashboard Data JSON**

Returns dashboard metrics and chart data.

**Response:**

```json
{
  "status": true,
  "message": "Dashboard data fetched successfully",
  "data": {
    "metrics": {
      "totalRequests": 15420,
      "avgResponseTime": 245,
      "successRate": 96.8,
      "errorRate": 3.2,
      "slaCompliance": 98.5
    },
    "charts": {
      "statusCodes": [
        { "code": 200, "count": 14950, "percentage": 96.8 },
        { "code": 400, "count": 320, "percentage": 2.1 },
        { "code": 500, "count": 150, "percentage": 1.1 }
      ],
      "methods": [
        { "method": "GET", "count": 12000, "percentage": 77.8 },
        { "method": "POST", "count": 2500, "percentage": 16.2 },
        { "method": "PUT", "count": 650, "percentage": 4.2 },
        { "method": "DELETE", "count": 270, "percentage": 1.8 }
      ]
    },
    "recentActivity": [
      {
        "endpoint": "/api/users",
        "method": "GET",
        "statusCode": 200,
        "responseTime": 150,
        "timestamp": "2024-01-15T10:45:00Z"
      }
    ]
  }
}
```

## Data Models

### ApiRequest

```typescript
interface ApiRequest {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  error?: string;
  isCached: boolean;
}
```

### EndpointPerformance

```typescript
interface EndpointPerformance {
  endpoint: string;
  totalRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  errorRate: number;
}
```

## Rate Limiting

Analytics endpoints are subject to rate limiting:

- **Authenticated requests**: 100 requests per minute
- **Admin endpoints**: 50 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Responses

### 401 Unauthorized

```json
{
  "status": false,
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

### 403 Forbidden

```json
{
  "status": false,
  "message": "Admin access required",
  "error": "FORBIDDEN"
}
```

### 429 Too Many Requests

```json
{
  "status": false,
  "message": "Rate limit exceeded",
  "error": "RATE_LIMIT_EXCEEDED"
}
```

### 500 Internal Server Error

```json
{
  "status": false,
  "message": "Failed to fetch analytics data",
  "error": "INTERNAL_ERROR"
}
```

## Performance Considerations

### Database Optimization

- Indexes on `ApiRequest.timestamp` for time-based queries
- Aggregated queries for large datasets
- Connection pooling for concurrent requests

### Caching Strategy

- Dashboard data cached for 5 minutes
- Metrics refreshed every minute
- Chart data cached per time range

### Monitoring

- Query performance logging
- Response time tracking
- Error rate monitoring
- Database connection health

## Security Considerations

### Access Control

- All endpoints require admin authentication
- Role-based permissions enforced
- Audit logging for all analytics access

### Data Privacy

- User IDs anonymized in public metrics
- IP addresses hashed for privacy
- Sensitive data excluded from logs

### Rate Limiting

- Prevents analytics endpoint abuse
- Graduated limits based on user role
- Automatic blocking for excessive requests

## Related Documentation

- [Analytics Guide](/guides/analytics) - Dashboard usage and features
- [Authentication Guide](/guides/authentication) - JWT authentication setup
- [Database Schema](/architecture/database) - Data models and relationships
