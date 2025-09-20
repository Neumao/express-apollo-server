import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger, config } from '../config/index.js';
import {
    loggingMiddleware,
    errorMiddleware,
    // rateLimitMiddleware
} from './middleware/index.js';
import apiRoutes from './routes/index.js';

// Create Express application
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(cookieParser());


// Apply rate limiting to all routes
// app.use(rateLimitMiddleware);

// API Routes
app.use('/api', apiRoutes);

// Test error endpoint - for development only
if (config.nodeEnv === 'development') {
    app.get('/api/test-error', (req, res, next) => {
        logger.debug('Test error endpoint accessed');
        const error = new Error('This is a test error');
        error.statusCode = 500;
        next(error);
    });
}

// 404 handler
app.use((req, res, next) => {
    if (req.path === '/graphql') return next();
    res.status(404).json({
        error: {
            message: 'Resource not found',
            statusCode: 404,
        },
    });
});

// Apply error middleware last
app.use(errorMiddleware);

export default app;
