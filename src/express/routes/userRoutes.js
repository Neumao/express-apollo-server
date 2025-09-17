import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authMiddleware, roleMiddleware } from '../middleware/index.js';

const router = express.Router();

/**
 * User routes
 * @route /api/users
 */

// Protected routes - require authentication
router.use(authMiddleware);

// Get user profile
router.get('/:id', UserController.getProfile);

// Update user profile
router.put('/:id', UserController.updateProfile);

// Delete user account
router.delete('/:id', UserController.deleteUser);

// Admin only routes
router.use(roleMiddleware('ADMIN'));

// Get all users (admin only)
router.get('/', UserController.getAllUsers);

export default router;