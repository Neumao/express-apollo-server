import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/index.js';

const router = express.Router();

/**
 * Analytics routes - admin only
 * @route /api/analytics
 */

// Protect all analytics routes - require admin role
// router.use(authMiddleware);
// router.use(roleMiddleware('ADMIN'));

/**
 * @route GET /api/analytics/
 * @desc Render analytics dashboard page
 * @access Admin
 */
router.get('/', AnalyticsController.renderDashboard);

/**
 * @route GET /api/analytics/metrics
 * @desc Get system metrics
 * @access Admin
 */
router.get('/metrics', AnalyticsController.getMetrics);

/**
 * @route GET /api/analytics/users
 * @desc Get user analytics
 * @access Admin
 */
router.get('/users', AnalyticsController.getUserAnalytics);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get dashboard data (JSON)
 * @access Admin
 */
router.get('/dashboard', AnalyticsController.getDashboard);

/**
 * @route GET /api/analytics/api
 * @desc Render detailed API analytics page
 * @access Admin
 */
router.get('/api', AnalyticsController.getApiAnalyticsPage);

/**
 * @route GET /api/analytics/logs
 * @desc Render logs page
 * @access Admin
 */
router.get('/logs', AnalyticsController.getLogsPage);

export default router;
