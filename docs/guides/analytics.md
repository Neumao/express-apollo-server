# Analytics & Monitoring Guide

<div class="hero">
  <h1>📊 Analytics Dashboard</h1>
  <p>Comprehensive API monitoring and performance insights</p>
</div>

## 🎯 Overview

The analytics system provides real-time monitoring and detailed insights into your API performance, usage patterns, and system health. Built with interactive charts and comprehensive metrics.

## 📈 Dashboard Features

### Main Dashboard (`/api/analytics`)

The main analytics dashboard provides a high-level overview of your API:

- **📊 Real-time Metrics**: Total requests, average response times, success/error rates
- **📈 SLA Compliance**: Service Level Agreement monitoring
- **👥 User Activity**: Most active users and request patterns
- **🔢 API Versions**: Endpoint usage statistics
- **⚡ Rate Limiting**: Current usage and limits

### Detailed API Analytics (`/api/analytics/api`)

Deep-dive into API performance with:

- **📊 Interactive Charts**:

  - Status code distribution (doughnut chart)
  - HTTP methods breakdown (bar chart)
  - Top endpoints by request count (horizontal bar)
  - Hourly request patterns (line chart)

- **📋 Endpoint Performance Table**:

  - Individual endpoint analysis
  - Response time statistics (avg, min, max)
  - Success and error rates
  - Performance status indicators

- **🔍 Filtering & Time Ranges**:
  - Last Hour, 24 Hours, 7 Days, 30 Days
  - Real-time data updates

### System Logs (`/api/analytics/logs`)

Comprehensive logging system with:

- **📝 Multiple Log Types**:

  - Application logs (general operations)
  - Error logs (exceptions and failures)
  - Exception logs (uncaught errors)
  - Rejection logs (promise rejections)

- **🔍 Advanced Filtering**:
  - Log type selection
  - Time range filtering
  - Auto-refresh capabilities
  - Keyboard shortcuts

## 🔧 API Endpoints

### JSON API Endpoints

```bash
# System metrics
GET /api/analytics/metrics

# User analytics
GET /api/analytics/users?timeRange=24h&limit=10

# Dashboard data
GET /api/analytics/dashboard
```

**Parameters:**

- `timeRange`: `1h`, `24h`, `7d`, `30d`
- `limit`: Number of results (default: 10)

### HTML Dashboard Endpoints

```bash
# Main dashboard
GET /api/analytics

# Detailed API analytics
GET /api/analytics/api?timeRange=24h

# System logs
GET /api/analytics/logs?logType=application&limit=100
```

## 📊 Metrics Collected

### Request Tracking

- **Endpoint**: API endpoint path
- **Method**: HTTP method (GET, POST, PUT, DELETE)
- **Status Code**: HTTP response status
- **Response Time**: Time to complete request (ms)
- **User Agent**: Client user agent string
- **IP Address**: Client IP address
- **Timestamp**: Request timestamp
- **User ID**: Associated user (if authenticated)

### Performance Metrics

- **Average Response Time**: Mean response time across all requests
- **Success Rate**: Percentage of 2xx/3xx responses
- **Error Rate**: Percentage of 4xx/5xx responses
- **Throughput**: Requests per minute/hour
- **Endpoint Performance**: Per-endpoint statistics

### Rate Limiting

- **Current Usage**: Requests in current window
- **Limit**: Maximum allowed requests
- **Remaining**: Requests left in window
- **Reset Time**: When the limit resets

## 🎨 Dashboard Customization

### Chart Configuration

All charts use Chart.js with responsive design:

```javascript
// Example chart configuration
{
  type: 'doughnut',
  data: {
    labels: ['Success', 'Error', 'Other'],
    datasets: [{
      data: [85, 10, 5],
      backgroundColor: ['#28a745', '#dc3545', '#ffc107']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
}
```

### Performance Indicators

- **🟢 Good**: Response time < 500ms, Success rate > 95%
- **🟡 Medium**: Response time 500-1000ms, Success rate 90-95%
- **🔴 Slow**: Response time > 1000ms, Success rate < 90%

## 🔍 Troubleshooting

### Common Issues

**Charts not loading:**

- Ensure Chart.js CDN is accessible
- Check browser console for JavaScript errors
- Verify data is being passed to templates

**Data not updating:**

- Check database connectivity
- Verify API tracking middleware is enabled
- Review server logs for errors

**Performance issues:**

- Consider adding database indexes on timestamp columns
- Implement data aggregation for large datasets
- Use caching for frequently accessed metrics

### Debug Mode

Enable debug logging to troubleshoot analytics:

```bash
# Set environment variable
DEBUG=analytics:* npm run dev

# Check logs for analytics queries
tail -f logs/application.log | grep analytics
```

## 🚀 Production Considerations

### Performance Optimization

- **Database Indexing**: Ensure indexes on `ApiRequest.timestamp`
- **Data Aggregation**: Consider pre-computed hourly/daily stats
- **Caching**: Cache dashboard data for high-traffic scenarios
- **Rate Limiting**: Protect analytics endpoints from abuse

### Monitoring

- **Log Rotation**: Configure Winston log rotation
- **Metrics Export**: Export metrics to monitoring systems
- **Alerts**: Set up alerts for performance degradation
- **Backup**: Regular backup of analytics data

### Security

- **Access Control**: Analytics endpoints require admin privileges
- **Data Privacy**: Ensure sensitive data is not logged
- **Rate Limiting**: Apply rate limits to analytics endpoints
- **Audit Logs**: Track access to analytics data

## 📚 Related Documentation

- [**Authentication Guide**](../guides/authentication) - User authentication and authorization
- [**API Reference**](../api/rest/analytics) - Complete REST API documentation
- [**Database Schema**](../architecture/database) - Database structure and relationships
- [**Testing Guide**](../guides/testing) - Testing analytics functionality
