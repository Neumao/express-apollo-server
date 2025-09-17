import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = express.Router();

/**
 * API Routes
 */

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

export default router;