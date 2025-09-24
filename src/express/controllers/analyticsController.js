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
                generatedAt: dashboardData.generatedAt
            };

            logger.debug('Rendering dashboard with data:', templateData);
            res.render('analytics-dashboard', templateData);
        } catch (error) {
            logger.error('Failed to render dashboard:', error);
            next(error);
        }
    }
}