import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../../config/logger.js';
import { apiResponse } from '../../../utils/response.js';
import prisma from '../../../../prisma/client.js';

/**
 * Controller for analytics dashboard
 */
export class AnalyticsController {
  /**
   * Get server metrics for dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getMetrics(req, res, next) {
    try {
      const metrics = {
        users: {
          total: await prisma.user.count(),
          active: await prisma.user.count({
            where: {
              lastLogin: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          }),
          newToday: await prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          }),
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
        },
      };

      res.json(apiResponse({
        status: true,
        message: 'Server metrics fetched successfully',
        data: metrics,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent logs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getLogs(req, res, next) {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const limit = parseInt(req.query.limit || '100', 10);
      const level = req.query.level || null;

      // Get log files
      const files = await fs.readdir(logDir);
      const latestLogFile = files
        .filter(file => file.startsWith('application-') && file.endsWith('.log'))
        .sort()
        .reverse()[0];

      if (!latestLogFile) {
        return res.json(apiResponse({
          status: true,
          message: 'No log files found',
          data: [],
        }));
      }

      // Read log file
      const logFilePath = path.join(logDir, latestLogFile);
      const content = await fs.readFile(logFilePath, 'utf8');

      // Parse logs
      const logs = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            const parts = line.split(' ');
            const timestamp = parts.slice(0, 2).join(' ');
            const levelWithColon = parts[2];
            const levelText = levelWithColon.substring(0, levelWithColon.length - 1);
            const message = parts.slice(3).join(' ');

            return {
              timestamp,
              level: levelText,
              message,
            };
          } catch (err) {
            return {
              timestamp: 'unknown',
              level: 'unknown',
              message: line,
            };
          }
        })
        .filter(log => !level || log.level === level)
        .slice(-limit);

      res.json(apiResponse({
        status: true,
        message: 'Logs fetched successfully',
        data: logs,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get API usage statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getApiUsage(req, res, next) {
    try {
      // For a real implementation, you would use a database or other storage
      // to track API usage. This is just a simple example.

      // In a production app, you might use Redis, a DB table, or
      // a time-series database to track API usage

      // For now, return mock data
      const usage = {
        endpoints: [
          { path: '/api/users', calls: 120, avgResponseTime: 45 },
          { path: '/api/auth/login', calls: 85, avgResponseTime: 120 },
          { path: '/api/auth/refresh-token', calls: 230, avgResponseTime: 30 },
          { path: '/graphql', calls: 340, avgResponseTime: 75 },
        ],
        timeFrames: [
          { time: '00:00', calls: 12 },
          { time: '01:00', calls: 5 },
          { time: '02:00', calls: 3 },
          { time: '03:00', calls: 2 },
          { time: '04:00', calls: 1 },
          { time: '05:00', calls: 2 },
          { time: '06:00', calls: 8 },
          { time: '07:00', calls: 15 },
          { time: '08:00', calls: 32 },
          { time: '09:00', calls: 47 },
          { time: '10:00', calls: 55 },
          { time: '11:00', calls: 48 },
          { time: '12:00', calls: 52 },
          { time: '13:00', calls: 46 },
          { time: '14:00', calls: 42 },
          { time: '15:00', calls: 45 },
          { time: '16:00', calls: 40 },
          { time: '17:00', calls: 38 },
          { time: '18:00', calls: 30 },
          { time: '19:00', calls: 25 },
          { time: '20:00', calls: 20 },
          { time: '21:00', calls: 15 },
          { time: '22:00', calls: 10 },
          { time: '23:00', calls: 8 },
        ],
      };

      res.json({ usage });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Render HTML dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async renderDashboard(req, res, next) {
    try {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Analytics Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1, h2, h3 {
      color: #2c3e50;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      margin: 10px 0;
      color: #3498db;
    }
    
    .metric-label {
      color: #7f8c8d;
      font-size: 14px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background-color: #f2f2f2;
    }
    
    tr:hover {
      background-color: #f5f5f5;
    }
    
    .chart {
      height: 300px;
      margin-top: 20px;
    }
    
    .log {
      font-family: monospace;
      padding: 8px;
      margin-bottom: 5px;
      border-radius: 4px;
    }
    
    .log-info {
      background-color: #d4edda;
    }
    
    .log-warn {
      background-color: #fff3cd;
    }
    
    .log-error {
      background-color: #f8d7da;
    }
    
    .log-debug {
      background-color: #d1ecf1;
    }
    
    .log-http {
      background-color: #e2e3e5;
    }
    
    .controls {
      margin-bottom: 20px;
    }
    
    button, select {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background-color: #3498db;
      color: white;
      cursor: pointer;
      margin-right: 10px;
    }
    
    button:hover {
      background-color: #2980b9;
    }
  </style>
</head>
<body>
  <h1>API Analytics Dashboard</h1>
  
  <div class="card">
    <h2>Server Metrics</h2>
    <div class="metrics-grid" id="server-metrics">
      <div class="metric">
        <div class="metric-value" id="total-users">-</div>
        <div class="metric-label">Total Users</div>
      </div>
      <div class="metric">
        <div class="metric-value" id="active-users">-</div>
        <div class="metric-label">Active Users (30d)</div>
      </div>
      <div class="metric">
        <div class="metric-value" id="new-users">-</div>
        <div class="metric-label">New Users Today</div>
      </div>
      <div class="metric">
        <div class="metric-value" id="uptime">-</div>
        <div class="metric-label">Server Uptime (hours)</div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2>API Usage</h2>
    <div class="chart" id="usage-chart"></div>
    <h3>Endpoint Performance</h3>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Calls</th>
          <th>Avg Response Time (ms)</th>
        </tr>
      </thead>
      <tbody id="endpoint-stats">
        <tr>
          <td colspan="3">Loading...</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="card">
    <h2>Recent Logs</h2>
    <div class="controls">
      <select id="log-level">
        <option value="">All Levels</option>
        <option value="info">Info</option>
        <option value="warn">Warning</option>
        <option value="error">Error</option>
        <option value="debug">Debug</option>
        <option value="http">HTTP</option>
      </select>
      <button id="refresh-logs">Refresh Logs</button>
    </div>
    <div id="logs">
      <div class="log">Loading logs...</div>
    </div>
  </div>

  <!-- Chart.js for data visualization -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <script>
    // Fetch server metrics
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/analytics/metrics');
        const data = await response.json();
        
        document.getElementById('total-users').textContent = data.metrics.users.total;
        document.getElementById('active-users').textContent = data.metrics.users.active;
        document.getElementById('new-users').textContent = data.metrics.users.newToday;
        document.getElementById('uptime').textContent = (data.metrics.server.uptime / 3600).toFixed(2);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    }
    
    // Fetch API usage stats
    async function fetchApiUsage() {
      try {
        const response = await fetch('/api/analytics/usage');
        const data = await response.json();
        
        // Update endpoints table
        const tbody = document.getElementById('endpoint-stats');
        tbody.innerHTML = '';
        
        data.usage.endpoints.forEach(endpoint => {
          const row = document.createElement('tr');
          row.innerHTML = \`
            <td>\${endpoint.path}</td>
            <td>\${endpoint.calls}</td>
            <td>\${endpoint.avgResponseTime} ms</td>
          \`;
          tbody.appendChild(row);
        });
        
        // Create chart
        const ctx = document.createElement('canvas');
        document.getElementById('usage-chart').innerHTML = '';
        document.getElementById('usage-chart').appendChild(ctx);
        
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.usage.timeFrames.map(frame => frame.time),
            datasets: [{
              label: 'API Calls per Hour',
              data: data.usage.timeFrames.map(frame => frame.calls),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      } catch (error) {
        console.error('Error fetching API usage:', error);
      }
    }
    
    // Fetch logs
    async function fetchLogs() {
      try {
        const level = document.getElementById('log-level').value;
        const url = level ? \`/api/analytics/logs?level=\${level}\` : '/api/analytics/logs';
        
        const response = await fetch(url);
        const data = await response.json();
        
        const logsContainer = document.getElementById('logs');
        logsContainer.innerHTML = '';
        
        if (data.logs.length === 0) {
          logsContainer.innerHTML = '<div class="log">No logs found</div>';
          return;
        }
        
        data.logs.forEach(log => {
          const logElement = document.createElement('div');
          logElement.className = \`log log-\${log.level.toLowerCase()}\`;
          logElement.textContent = \`[\${log.timestamp}] \${log.level}: \${log.message}\`;
          logsContainer.appendChild(logElement);
        });
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    }
    
    // Initialize dashboard
    function init() {
      fetchMetrics();
      fetchApiUsage();
      fetchLogs();
      
      // Set up event listeners
      document.getElementById('refresh-logs').addEventListener('click', fetchLogs);
      document.getElementById('log-level').addEventListener('change', fetchLogs);
      
      // Refresh data periodically
      setInterval(fetchMetrics, 30000); // every 30 seconds
      setInterval(fetchApiUsage, 60000); // every minute
    }
    
    // Start the dashboard when the page loads
    window.addEventListener('load', init);
  </script>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }
}