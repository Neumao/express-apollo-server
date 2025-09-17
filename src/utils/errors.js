/**
 * Custom error classes for application-specific error handling
 * These allow for more semantic error handling throughout the app
 */

// Base application error class
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 400: Bad Request - Invalid input or data validation failure
export class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400);
    }
}

// 401: Unauthorized - Authentication failed or not provided
export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}

// 403: Forbidden - User doesn't have permission
export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
    }
}

// 404: Not Found - Resource not found
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

// 409: Conflict - Resource conflict (e.g. duplicate entry)
export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

// 429: Too Many Requests - Rate limiting
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}

// 500: Internal Server Error - Unexpected server error
export class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}