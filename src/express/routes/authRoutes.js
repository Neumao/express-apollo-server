import express from 'express';
import { AuthController } from '../controllers/authController.js';
import {
    authMiddleware,
    // authRateLimitMiddleware
} from '../middleware/index.js';

const router = express.Router();

/**
 * Authentication routes
 * @route /api/auth
 */

// Register new user
router.post('/register', AuthController.register);

// Login - with stricter rate limiting
// router.post('/login', authRateLimitMiddleware, AuthController.login);

// Refresh token
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes - require authentication
router.use(authMiddleware);

// Get current user
router.get('/me', AuthController.getCurrentUser);

// Logout
router.post('/logout', AuthController.logout);

export default router;