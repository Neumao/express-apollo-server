import { logger } from '../../../config/logger.js';
import { apiResponse } from '../../../utils/response.js';
import { AnalyticsService } from '../../services/analyticsService.js';

export class AnalyticsController {
  static async getMetrics(req, res, next) {
    try {
      const metrics = await AnalyticsService.getServerMetrics();
      logger.debug('Server Metrics:', metrics);
      res.json(apiResponse({
        status: true,
        message: 'Server metrics fetched successfully',
        data: metrics,
      }));
    } catch (error) {
      logger.error('Failed to fetch server metrics:', error);
      next(error);
    }
  }

  static async getUserAnalytics(req, res, next) {
    try {
      const { timeRange = '24h', limit = 10 } = req.query;
      const userAnalytics = await AnalyticsService.getUserAnalytics(timeRange, parseInt(limit));
      res.json(apiResponse({
        status: true,
        message: 'User analytics fetched successfully',
        data: userAnalytics,
      }));
    } catch (error) {
      logger.error('Failed to fetch user analytics:', error);
      next(error);
    }
  }

  static async getLogs(req, res, next) {
    try {
      const { logType = '', logDate = '', level = '', limit = 50 } = req.query;
      const logs = await AnalyticsService.getApplicationLogs(parseInt(limit), level);
      res.json(apiResponse({
        status: true,
        message: 'Application logs fetched successfully',
        data: { logs, filters: { logType, logDate, level, limit }, totalCount: logs.length },
      }));
    } catch (error) {
      logger.error('Failed to fetch application logs:', error);
      next(error);
    }
  }

  static async getDashboard(req, res, next) {
    try {
      let dashboardData;
      try {
        // Get all required data
        dashboardData = await AnalyticsService.getDashboardData();
        logger.debug('Raw Dashboard Data:', dashboardData);
      } catch (error) {
        logger.error('Error fetching dashboard data:', error);
        dashboardData = null;
      }

      let logs = [];
      try {
        logs = await AnalyticsService.getApplicationLogs(20);
        logger.debug('Raw Logs:', logs);
      } catch (error) {
        logger.error('Error fetching logs:', error);
      }

      // Format data for the template with safe defaults
      const timestamp = new Date().toLocaleString();

      // Ensure metrics exist with defaults
      const metrics = {
        totalUsers: dashboardData?.metrics?.totalUsers || 0,
        activeUsers: dashboardData?.metrics?.activeUsers || 0,
        verifiedUsers: dashboardData?.metrics?.verifiedUsers || 0,
        unverifiedUsers: dashboardData?.metrics?.unverifiedUsers || 0,
        newUsersToday: dashboardData?.metrics?.newUsersToday || 0,
        totalQueries: dashboardData?.metrics?.totalQueries || 0,
        avgResponseTime: Math.round(dashboardData?.metrics?.avgResponseTime || 0),
        errorRate: Math.round((dashboardData?.metrics?.errorRate || 0) * 100) / 100,
        successRate: Math.round((dashboardData?.metrics?.successRate || 100) * 100) / 100,
        memoryUsage: Math.round((dashboardData?.metrics?.memoryUsage || 0) * 100),
        memoryUsageMB: Math.round(dashboardData?.metrics?.memoryUsageMB || 0),
        memoryTotalMB: Math.round(dashboardData?.metrics?.memoryTotalMB || 0),
        memoryFreeMB: Math.round(dashboardData?.metrics?.memoryFreeMB || 0),
        processMemoryMB: Math.round(dashboardData?.metrics?.processMemoryMB || 0)
      };

      // Prepare chart data with safe defaults
      const chartData = {
        userGrowth: {
          labels: dashboardData?.chartData?.userGrowth?.labels || [],
          data: dashboardData?.chartData?.userGrowth?.data || []
        },
        apiRequests: {
          labels: dashboardData?.chartData?.apiRequests?.labels || [],
          data: dashboardData?.chartData?.apiRequests?.data || []
        },
        responseTime: {
          labels: dashboardData?.chartData?.responseTime?.labels || [],
          data: dashboardData?.chartData?.responseTime?.data || []
        },
        userActivity: {
          labels: dashboardData?.chartData?.userActivity?.labels || [],
          data: dashboardData?.chartData?.userActivity?.data || []
        }
      };

      // Log prepared data for debugging
      logger.debug('Prepared Template Data:', {
        timestamp,
        metrics,
        chartData,
        logsCount: logs.length
      });

      // Render the dashboard with prepared data
      res.render('analytics-dashboard', {
        timestamp,
        metrics,
        chartData,
        logs: logs.slice(0, 20)
      });
    } catch (error) {
      logger.error('Failed to render dashboard:', error);
      next(error);
    }
  }

  static async getLogFilesInfo(req, res, next) {
    try {
      const logFiles = await AnalyticsService.getLogFilesInfo();
      res.json(apiResponse({
        status: true,
        message: 'Log files info fetched successfully',
        data: logFiles,
      }));
    } catch (error) {
      logger.error('Failed to fetch log files info:', error);
      next(error);
    }
  }
}