import { logger } from '../../config/logger.js';
import { apiResponse } from '../../utils/response.js';
import { AnalyticsService } from '../services/analyticsService.js';

/**
 * Analytics Controller
 * Handles analytics-related HTTP requests
 */
export class AnalyticsController {
    /**
     * Get system metrics
     * @route GET /api/analytics/metrics
     */
    static async getMetrics(req, res, next) {
        try {
            const metrics = await AnalyticsService.getSystemMetrics();
            logger.debug('System Metrics:', metrics);
            res.json(apiResponse({
                status: true,
                message: 'System metrics fetched successfully',
                data: metrics,
            }));
        } catch (error) {
            logger.error('Failed to fetch system metrics:', error);
            next(error);
        }
    }

    /**
     * Get user analytics
     * @route GET /api/analytics/users
     */
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

    /**
     * Get analytics dashboard data
     * @route GET /api/analytics/dashboard
     */
    static async getDashboard(req, res, next) {
        try {
            const dashboardData = await AnalyticsService.getDashboardData();
            res.json(apiResponse({
                status: true,
                message: 'Dashboard data fetched successfully',
                data: dashboardData,
            }));
        } catch (error) {
            logger.error('Failed to fetch dashboard data:', error);
            next(error);
        }
    }

    /**
     * Render analytics dashboard page
     * @route GET /api/analytics/
     */
    static async renderDashboard(req, res, next) {
        try {
            const dashboardData = await AnalyticsService.getDashboardData();

            // Format data for template
            const templateData = {
                title: 'Apollo GraphQL Analytics Dashboard',
                timestamp: new Date().toLocaleString(),
                system: {
                    ...dashboardData.system,
                    cpu: {
                        ...dashboardData.system.cpu,
                        loadAverage1m: dashboardData.system.cpu.loadAverage[0],
                        loadAverage5m: dashboardData.system.cpu.loadAverage[1],
                        loadAverage15m: dashboardData.system.cpu.loadAverage[2]
                    }
                },
                users: dashboardData.users,
                monthlyGrowth: dashboardData.monthlyGrowth,
                api: dashboardData.api,
                apiSchema: dashboardData.apiSchema,
                advanced: dashboardData.advanced,
                business: dashboardData.business,
                performance: dashboardData.performance,
                traffic: dashboardData.traffic,
                activity: dashboardData.activity,
                generatedAt: dashboardData.generatedAt
            };

            logger.debug('Rendering dashboard with data:', templateData);
            res.render('analytics-dashboard', templateData);
        } catch (error) {
            logger.error('Failed to render dashboard:', error);
            next(error);
        }
    }

    /**
     * Render detailed API analytics page
     * @route GET /api/analytics/api
     */
    static async getApiAnalyticsPage(req, res, next) {
        try {
            const { timeRange = '24h', page = 1 } = req.query;
            const pageNum = parseInt(page);

            // Get detailed API analytics data (no pagination for now)
            const apiData = await AnalyticsService.getDetailedApiAnalytics(timeRange, pageNum, 1000);

            const templateData = {
                title: 'API Analytics - Detailed View',
                timestamp: new Date().toLocaleString(),
                timeRange,
                currentPage: pageNum,
                ...apiData
            };

            logger.debug('Rendering API analytics page');
            res.render('api-analytics', templateData);
        } catch (error) {
            logger.error('Failed to render API analytics page:', error);
            next(error);
        }
    }

    /**
     * Render logs page
     * @route GET /api/analytics/logs
     */
    static async getLogsPage(req, res, next) {
        try {
            const { logType = 'application', limit = 100 } = req.query;

            // Get logs data
            const logsData = await AnalyticsService.getLogsData(logType, parseInt(limit));

            const templateData = {
                title: 'System Logs',
                timestamp: new Date().toLocaleString(),
                logType,
                limit: parseInt(limit),
                ...logsData
            };

            logger.debug('Rendering logs page');
            res.render('logs', templateData);
        } catch (error) {
            logger.error('Failed to render logs page:', error);
            next(error);
        }
    }
}