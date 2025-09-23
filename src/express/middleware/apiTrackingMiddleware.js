import { logger } from '../../config/logger.js';
import prisma from '../../../prisma/client.js';

/**
 * Middleware to track API requests and responses
 */
export const apiTrackingMiddleware = async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const requestData = {
        endpoint: req.originalUrl || req.url,
        method: req.method,
        userAgent: req.get('user-agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
        userId: req.user?.id,
        isCached: false
    };

    // Override send to intercept the response
    res.send = function (body) {
        const responseTime = Date.now() - startTime;

        // Log request tracking
        logger.debug(`Tracking API request: ${req.method} ${req.originalUrl}`);

        // Store the API request asynchronously
        prisma.apiRequest.create({
            data: {
                ...requestData,
                statusCode: res.statusCode,
                responseTime,
                isError: res.statusCode >= 400,
                error: res.statusCode >= 400 ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
            }
        }).catch(error => {
            logger.error('Failed to store API request:', error);
        });

        // Call the original send
        originalSend.apply(res, arguments);
        return res;
    };

    next();
};

// Export stats utility functions
export const apiTracker = {
    /**
     * Get API request statistics for the dashboard
     */
    getStats: async () => {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        try {
            const requests = await prisma.apiRequest.findMany({
                where: {
                    timestamp: {
                        gte: last24Hours
                    }
                },
                select: {
                    statusCode: true,
                    responseTime: true,
                    endpoint: true,
                    timestamp: true
                }
            });

            if (requests.length === 0) {
                return {
                    totalRequests: 0,
                    avgResponseTime: 0,
                    errorRate: 0,
                    successRate: 100,
                    requestsPerHour: Array(24).fill(0),
                    recentResponseTimes: Array(24).fill(50),
                    topEndpoints: []
                };
            }

            // Calculate metrics
            const totalRequests = requests.length;
            const errorRequests = requests.filter(r => r.statusCode >= 400).length;
            const errorRate = (errorRequests / totalRequests) * 100;
            const successRate = 100 - errorRate;

            // Calculate average response time
            const totalResponseTime = requests.reduce((sum, r) => sum + r.responseTime, 0);
            const avgResponseTime = Math.round(totalResponseTime / totalRequests);

            // Calculate requests per hour
            const requestsPerHour = Array(24).fill(0);
            const responseTimesPerHour = Array(24).fill([]);

            requests.forEach(request => {
                const hoursDiff = Math.floor((now - new Date(request.timestamp)) / (1000 * 60 * 60));
                if (hoursDiff >= 0 && hoursDiff < 24) {
                    requestsPerHour[23 - hoursDiff]++;
                    if (!responseTimesPerHour[23 - hoursDiff]) {
                        responseTimesPerHour[23 - hoursDiff] = [];
                    }
                    responseTimesPerHour[23 - hoursDiff].push(request.responseTime);
                }
            });

            // Calculate hourly average response times
            const recentResponseTimes = responseTimesPerHour.map(times =>
                times.length > 0
                    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
                    : 50 // Default value when no data
            );

            // Get endpoint statistics
            const endpointStats = {};
            requests.forEach(request => {
                if (!endpointStats[request.endpoint]) {
                    endpointStats[request.endpoint] = { count: 0, totalTime: 0, errors: 0 };
                }
                endpointStats[request.endpoint].count++;
                endpointStats[request.endpoint].totalTime += request.responseTime;
                if (request.statusCode >= 400) {
                    endpointStats[request.endpoint].errors++;
                }
            });

            const topEndpoints = Object.entries(endpointStats)
                .map(([endpoint, stats]) => ({
                    endpoint,
                    requests: stats.count,
                    avgResponseTime: Math.round(stats.totalTime / stats.count),
                    errorRate: Math.round((stats.errors / stats.count) * 100)
                }))
                .sort((a, b) => b.requests - a.requests)
                .slice(0, 10);

            return {
                totalRequests,
                avgResponseTime,
                errorRate: Math.round(errorRate * 100) / 100,
                successRate: Math.round(successRate * 100) / 100,
                requestsPerHour,
                recentResponseTimes,
                topEndpoints
            };
        } catch (error) {
            logger.error('Failed to get API stats:', error);
            return {
                totalRequests: 0,
                avgResponseTime: 0,
                errorRate: 0,
                successRate: 100,
                requestsPerHour: Array(24).fill(0),
                recentResponseTimes: Array(24).fill(50),
                topEndpoints: []
            };
        }
    }
};
