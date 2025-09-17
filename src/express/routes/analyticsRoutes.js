import express from 'express';
import { AnalyticsController } from '../controllers/analytics/analyticsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/index.js';

const router = express.Router();

/**
 * Analytics routes - admin only
 * @route /api/analytics
 */

// Protect all analytics routes - require admin role
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

// Get server metrics
router.get('/metrics', AnalyticsController.getMetrics);

// Get recent logs
router.get('/logs', AnalyticsController.getLogs);

// Get API usage statistics
router.get('/usage', AnalyticsController.getApiUsage);

// Render analytics dashboard
router.get('/', AnalyticsController.renderDashboard);

export default router;