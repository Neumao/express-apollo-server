import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger, config } from '../config/index.js';
import {
    loggingMiddleware,
    errorMiddleware,
    // rateLimitMiddleware
} from './middleware/index.js';
import { apiTrackingMiddleware } from './middleware/apiTrackingMiddleware.js';
import apiRoutes from './routes/index.js';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();

// Configure Handlebars view engine
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false,
    helpers: {
        json: function (context) {
            return JSON.stringify(context);
        },
        eq: function (a, b) {
            return a === b;
        },
        gt: function (a, b) {
            return a > b;
        },
        lt: function (a, b) {
            return a < b;
        },
        subtract: function (a, b) {
            return a - b;
        },
        add: function (a, b) {
            return a + b;
        },
        formatDate: function (date) {
            return new Date(date).toLocaleString();
        },
        truncate: function (str, len) {
            if (str && str.length > len) {
                return str.substring(0, len) + '...';
            }
            return str;
        },
        capitalize: function (str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        countBy: function (array, property, value) {
            if (!Array.isArray(array)) return 0;
            return array.filter(item => item[property] === value).length;
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../templates'));

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(apiTrackingMiddleware); // Track API usage
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
