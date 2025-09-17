import rateLimit from 'express-rate-limit';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';
import { RateLimitError } from '../../utils/errors.js';

/**
 * Rate limiting middleware for API protection
 * Limits the number of requests from a single IP address within a time window
 */
export const rateLimitMiddleware = rateLimit({
    windowMs: config.rateLimit.windowMs, // Default: 15 minutes
    max: config.rateLimit.max, // Default: 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers

    // Skip rate limiting for trusted IPs (e.g. internal services)
    skip: (req) => {
        // Example: Skip for internal IPs or with specific API keys
        // const trustedIPs = ['127.0.0.1', '::1'];
        // return trustedIPs.includes(req.ip);
        return false; // No skipping by default
    },

    // Custom handler for rate limit exceeded
    handler: (req, res, next, options) => {
        const ip = req.ip;
        logger.warn(`Rate limit exceeded for IP: ${ip}`, {
            path: req.originalUrl,
            method: req.method,
            ip,
        });

        // Use our custom error
        next(new RateLimitError('Too many requests, please try again later'));
    },

    // Store client data in a more advanced store (optional)
    // For production, consider using a Redis store
    // store: new RedisStore({...})
});

/**
 * Stricter rate limiting for authentication endpoints
 * to prevent brute force attacks
 */
export const authRateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use email as key if available, otherwise IP
        return req.body.email || req.ip;
    },
    handler: (req, res, next, options) => {
        const key = req.body.email || req.ip;
        logger.warn(`Auth rate limit exceeded: ${key}`, {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });

        next(new RateLimitError('Too many login attempts, please try again later'));
    },
});