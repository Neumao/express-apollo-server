import { logger } from '../../../config/logger.js';
import { apiResponse } from '../../../utils/response.js';
import { AnalyticsService } from '../../services/analyticsService.js';

/**
 * Analytics Controller
 * Handles analytics-related HTTP requests
 */
export class AnalyticsController {
    /**
     * Get system metrics
     */
    static async getMetrics(req, res, next) {
        try {
            const metrics = await AnalyticsService.getSystemMetrics();
            logger.debug('System metrics fetched');
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
     * Get dashboard data
     */
    static async getDashboard(req, res, next) {
        try {
            const dashboardData = await AnalyticsService.getDashboardData();
            logger.debug('Dashboard data fetched');

            // Render the dashboard template
            res.render('analytics-dashboard', {
                title: 'Analytics Dashboard',
                data: dashboardData,
                timestamp: new Date().toLocaleString()
            });
        } catch (error) {
            logger.error('Failed to render dashboard:', error);
            next(error);
        }
    }
}
