/**
 * Environment configuration
 * Centralizes all environment variable access and provides defaults
 */
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const config = {
    // Server configuration
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database configuration - these values come from .env file
    database: {
        url: process.env.DATABASE_URL,
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-should-be-in-env',
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        fileMaxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '7d',
    },

    // Email configuration
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        from: process.env.EMAIL_FROM || 'noreply@example.com',
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15', 10) * 60 * 1000, // default 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // default 100 requests per windowMs
    },

    // System User
    systemUser: {
        email: process.env.SYSTEM_ADMIN_EMAIL,
        password: process.env.SYSTEM_ADMIN_PASSWORD,
        userName: process.env.SYSTEM_ADMIN_USERNAME
    }
};

export default config;