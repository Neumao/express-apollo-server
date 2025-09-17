import morgan from 'morgan';
import { stream } from '../../config/logger.js';

// Create a custom token for request body
morgan.token('body', (req) => {
    // Don't log sensitive information like passwords
    const body = { ...req.body };
    if (body.password) body.password = '[REDACTED]';
    if (body.token) body.token = '[REDACTED]';

    return JSON.stringify(body);
});

// Export Morgan middleware configured to use our logger's stream

// Create the Morgan middleware
const morganMiddleware = morgan(
    ':method :url :status :response-time ms - :body',
    { stream }
);

// Export a wrapper middleware that skips IntrospectionQuery
export function loggingMiddleware(req, res, next) {
    if (
        req.method === 'POST' &&
        req.path === '/graphql' &&
        req.body &&
        req.body.operationName === 'IntrospectionQuery'
    ) {
        return next(); // Skip logging
    }
    return morganMiddleware(req, res, next);
}