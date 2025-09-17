import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/errors.js';

/**
 * Central error handler for Express
 * Logs errors and sends appropriate responses based on error type
 */
export const errorMiddleware = (err, req, res, next) => {
    // Log the error with appropriate level based on status code
    const logMethod = err.statusCode >= 500 ? 'error' : 'warn';

    logger[logMethod](`${err.name}: ${err.message}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id || 'unauthenticated',
        statusCode: err.statusCode || 500,
        stack: err.stack,
    });

    // Handle known errors using our custom AppError class
    if (err instanceof AppError) {
        const response = {
            error: {
                message: err.message,
                statusCode: err.statusCode,
                name: err.name,
            },
        };

        // Add stack trace in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            response.error.stack = err.stack;
        }

        return res.status(err.statusCode).json(response);
    }

    // Handle Prisma errors
    if (err.code && err.code.startsWith('P')) {
        const statusCode = 400;
        const message = handlePrismaError(err);

        return res.status(statusCode).json({
            error: {
                message,
                statusCode,
                name: 'PrismaError',
                code: err.code,
            },
        });
    }

    // Handle unknown errors
    const response = {
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal Server Error'
                : err.message || 'Internal Server Error',
            statusCode: 500,
        },
    };

    if (process.env.NODE_ENV !== 'production') {
        response.error.stack = err.stack;
    }

    res.status(500).json(response);
};

/**
 * Helper function to provide friendly messages for Prisma errors
 */
function handlePrismaError(err) {
    switch (err.code) {
        case 'P2002':
            return `A record with this ${err.meta?.target?.join(', ')} already exists.`;
        case 'P2025':
            return 'Record not found.';
        case 'P2003':
            return `Foreign key constraint failed on field: ${err.meta?.field_name}.`;
        case 'P2014':
            return 'The change you are trying to make would violate the required relation between models.';
        default:
            return 'An error occurred with the database operation.';
    }
}