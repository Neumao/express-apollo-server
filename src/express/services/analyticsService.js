import os from 'os';
import process from 'process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../../prisma/client.js';
import { logger } from '../../config/logger.js';

/**
 * Core Analytics Service
 * Handles all analytics-related business logic with modular design
 */
export class AnalyticsService {
    /**
     * System Metrics Collector
     * Collects system-level performance metrics
     */
    static async getSystemMetrics() {
        try {
            logger.debug('Collecting system metrics...');

            const memoryUsage = process.memoryUsage();
            const cpus = os.cpus();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;

            // Calculate CPU usage (more accurate)
            const cpuUsage = cpus.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
                const idle = cpu.times.idle;
                return acc + ((total - idle) / total) * 100;
            }, 0) / cpus.length;

            // Get load average (Windows doesn't support loadavg properly, show CPU usage as percentage)
            const rawLoadAvg = os.loadavg();
            console.log('DEBUG - Raw load average:', rawLoadAvg, 'CPU usage:', cpuUsage, 'Platform:', process.platform);
            const loadAverage = process.platform === 'win32' ? [cpuUsage, cpuUsage, cpuUsage] : rawLoadAvg; // Show CPU usage % on Windows
            console.log('DEBUG - Final load average:', loadAverage);

            // Format uptime as HH:MM:SS
            const uptimeSeconds = Math.floor(process.uptime());
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            const formattedUptime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            const metrics = {
                cpu: {
                    usage: Math.round(cpuUsage * 100) / 100,
                    cores: cpus.length,
                    model: cpus[0]?.model || 'Unknown',
                    loadAverage: loadAverage
                },
                memory: {
                    used: Math.round(usedMem / 1024 / 1024),
                    total: Math.round(totalMem / 1024 / 1024),
                    free: Math.round(freeMem / 1024 / 1024),
                    usagePercent: Math.round((usedMem / totalMem) * 100),
                    usedGB: Math.round((usedMem / 1024 / 1024 / 1024) * 100) / 100,
                    totalGB: Math.round((totalMem / 1024 / 1024 / 1024) * 100) / 100,
                    freeGB: Math.round((freeMem / 1024 / 1024 / 1024) * 100) / 100
                },
                process: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    rss: Math.round(memoryUsage.rss / 1024 / 1024),
                    external: Math.round(memoryUsage.external / 1024 / 1024),
                    uptime: uptimeSeconds,
                    uptimeFormatted: formattedUptime,
                    pid: process.pid,
                    platform: process.platform,
                    arch: process.arch,
                    nodeVersion: process.version
                },
                system: {
                    hostname: os.hostname(),
                    platform: os.platform(),
                    arch: os.arch(),
                    release: os.release(),
                    uptime: Math.floor(os.uptime())
                },
                timestamp: new Date().toISOString()
            };

            logger.debug('System metrics collected:', metrics);
            return metrics;

        } catch (error) {
            logger.error('Error collecting system metrics:', error);
            throw new Error('Failed to collect system metrics');
        }
    }

    /**
     * User Analytics Collector
     * Collects user-related metrics and statistics
     */
    static async getUserAnalytics(timeRange = '24h', limit = 10) {
        try {
            logger.debug('Collecting user analytics...', { timeRange, limit });

            const now = new Date();
            let startDate;

            // Calculate start date based on time range
            switch (timeRange) {
                case '1h':
                    startDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }

            // Get user statistics
            const [
                totalUsers,
                newUsers,
                activeUsers,
                verifiedUsers
            ] = await Promise.all([
                prisma.user.count(),
                prisma.user.count({
                    where: { createdAt: { gte: startDate } }
                }),
                prisma.user.count({
                    where: { lastLoginAt: { gte: startDate } }
                }),
                prisma.user.count({
                    where: { isVerified: true }
                })
            ]);

            // Get recent user registrations
            const recentUsers = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                    lastLoginAt: true,
                    isVerified: true
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });

            const analytics = {
                summary: {
                    totalUsers,
                    newUsers,
                    activeUsers,
                    verifiedUsers,
                    unverifiedUsers: totalUsers - verifiedUsers
                },
                recentUsers,
                timeRange,
                generatedAt: new Date().toISOString()
            };

            logger.debug('User analytics collected:', analytics);
            return analytics;

        } catch (error) {
            logger.error('Error collecting user analytics:', error);
            throw new Error('Failed to collect user analytics');
        }
    }

    /**
     * Get API Request Analytics
     * Returns API request statistics
     */
    static async getApiAnalytics(timeRange = '24h') {
        try {
            logger.debug('Getting API analytics...');

            const now = new Date();
            let startDate;

            switch (timeRange) {
                case '1h':
                    startDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }

            try {
                const [
                    totalRequests,
                    avgResponseTime,
                    errorCount,
                    cachedRequests,
                    topEndpointResult,
                    p95ResponseTimeResult,
                    timeRangeMinutes
                ] = await Promise.all([
                    prisma.apiRequest.count({
                        where: { timestamp: { gte: startDate } }
                    }),
                    prisma.apiRequest.aggregate({
                        where: { timestamp: { gte: startDate } },
                        _avg: { responseTime: true }
                    }).catch(() => ({ _avg: { responseTime: 0 } })),
                    prisma.apiRequest.count({
                        where: {
                            timestamp: { gte: startDate },
                            isError: true
                        }
                    }),
                    prisma.apiRequest.count({
                        where: {
                            timestamp: { gte: startDate },
                            isCached: true
                        }
                    }),
                    prisma.apiRequest.groupBy({
                        by: ['endpoint'],
                        where: { timestamp: { gte: startDate } },
                        _count: { endpoint: true },
                        orderBy: { _count: { endpoint: 'desc' } },
                        take: 1
                    }).catch(() => []),
                    // Calculate 95th percentile response time
                    prisma.$queryRaw`
                        SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY "responseTime") as p95
                        FROM "ApiRequest"
                        WHERE "timestamp" >= ${startDate}
                    `.catch(() => [{ p95: 0 }]),
                    // Calculate time range in minutes for RPM calculation
                    Promise.resolve(Math.max(1, Math.floor((now - startDate) / (1000 * 60))))
                ]);

                const topEndpoint = topEndpointResult.length > 0 ? topEndpointResult[0].endpoint : 'N/A';
                const p95ResponseTime = Math.round(p95ResponseTimeResult[0]?.p95 || 0);
                const errorRate = totalRequests > 0 ? Math.round((errorCount / totalRequests) * 100) : 0;
                const successRate = 100 - errorRate;
                const requestsPerMinute = Math.round(totalRequests / timeRangeMinutes);

                const analytics = {
                    totalRequests: totalRequests,
                    avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
                    p95ResponseTime: p95ResponseTime,
                    errorCount: errorCount,
                    errorRate: errorRate,
                    successRate: successRate,
                    cachedRequests: cachedRequests,
                    cacheRate: totalRequests > 0 ? Math.round((cachedRequests / totalRequests) * 100) : 0,
                    topEndpoint: topEndpoint,
                    requestsPerMinute: requestsPerMinute,
                    highErrorRate: errorRate > 5,
                    mediumErrorRate: errorRate > 2 && errorRate <= 5
                };

                logger.debug('API analytics retrieved');
                return analytics;
            } catch (dbError) {
                logger.warn('Database query failed for API analytics, returning defaults:', dbError.message);
                return {
                    totalRequests: 0,
                    avgResponseTime: 0,
                    p95ResponseTime: 0,
                    errorCount: 0,
                    errorRate: 0,
                    successRate: 100,
                    cachedRequests: 0,
                    cacheRate: 0,
                    topEndpoint: 'N/A',
                    requestsPerMinute: 0,
                    highErrorRate: false,
                    mediumErrorRate: false
                };
            }

        } catch (error) {
            logger.error('Error getting API analytics:', error);
            throw new Error('Failed to get API analytics');
        }
    }

    /**
     * Get Monthly User Growth Data
     * Returns user registration data for the last 6 months
     */
    static async getMonthlyUserGrowth() {
        try {
            logger.debug('Getting monthly user growth data...');

            const now = new Date();
            const monthlyData = [];

            try {
                // Get data for last 6 months
                for (let i = 5; i >= 0; i--) {
                    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

                    const [newUsers, activeUsers] = await Promise.all([
                        prisma.user.count({
                            where: {
                                createdAt: {
                                    gte: monthStart,
                                    lt: monthEnd
                                }
                            }
                        }).catch(() => 0),
                        prisma.user.count({
                            where: {
                                lastLoginAt: {
                                    gte: monthStart,
                                    lt: monthEnd
                                }
                            }
                        }).catch(() => 0)
                    ]);

                    const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });

                    monthlyData.push({
                        month: monthName,
                        newUsers: newUsers,
                        activeUsers: activeUsers
                    });
                }

                logger.debug('Monthly user growth data retrieved');
                return monthlyData;
            } catch (dbError) {
                logger.warn('Database query failed for monthly growth, returning empty array:', dbError.message);
                return [];
            }

        } catch (error) {
            logger.error('Error getting monthly user growth data:', error);
            throw new Error('Failed to get monthly user growth data');
        }
    }

    /**
     * Get API Schema Analytics
     * Returns API structure and capabilities metrics
     */
    static async getApiSchemaAnalytics() {
        try {
            logger.debug('Getting API schema analytics...');

            // Count Prisma models by reading schema file
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            const modelMatches = schemaContent.match(/model\s+\w+/g) || [];
            const prismaModels = modelMatches.length;

            // Count REST API endpoints (from routes)
            const restEndpoints = 13; // Based on route analysis: auth(4) + users(4) + analytics(4) + health(1)

            // Count GraphQL operations
            const graphqlQueries = 4; // hello, me, user, users
            const graphqlMutations = 6; // triggerTestSubscription, register, login, logout, updateUser, deleteUser
            const graphqlSubscriptions = 1; // testSubscription

            const analytics = {
                prismaModels: prismaModels,
                restEndpoints: restEndpoints,
                graphqlQueries: graphqlQueries,
                graphqlMutations: graphqlMutations,
                graphqlSubscriptions: graphqlSubscriptions,
                totalGraphqlOperations: graphqlQueries + graphqlMutations + graphqlSubscriptions,
                totalApiEndpoints: restEndpoints + graphqlQueries + graphqlMutations + graphqlSubscriptions
            };

            logger.debug('API schema analytics retrieved');
            return analytics;
        } catch (error) {
            logger.error('Error getting API schema analytics:', error);
            throw new Error('Failed to get API schema analytics');
        }
    }

    /**
     * Get Recent Activity
     * Returns latest user registrations and user activities
     */
    static async getRecentActivity(limit = 5) {
        try {
            logger.debug('Getting recent activity...');

            try {
                const recentUsers = await prisma.user.findMany({
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        isVerified: true,
                        lastLoginAt: true,
                        emailVerificationToken: true,
                        resetPasswordToken: true,
                        createdAt: true,
                        updatedAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit
                }).catch(() => []);

                // Generate recent user activity from user data
                const recentUserActivity = [];
                const now = new Date();

                recentUsers.forEach(user => {
                    const userName = user.firstName && user.lastName ?
                        `${user.firstName} ${user.lastName}` : user.email;

                    // Recent registration (within last 7 days)
                    if (Math.abs(now - user.createdAt) < 7 * 24 * 60 * 60 * 1000) {
                        recentUserActivity.push({
                            userName,
                            action: 'joined the platform',
                            type: 'primary',
                            details: '',
                            timestamp: user.createdAt
                        });
                    }

                    // Recent login (within last 24 hours)
                    if (user.lastLoginAt && Math.abs(now - user.lastLoginAt) < 24 * 60 * 60 * 1000) {
                        recentUserActivity.push({
                            userName,
                            action: 'logged in',
                            type: 'info',
                            details: '',
                            timestamp: user.lastLoginAt
                        });
                    }

                    // Recent verification (within last 24 hours)
                    if (user.isVerified && user.emailVerificationToken &&
                        Math.abs(now - user.updatedAt) < 24 * 60 * 60 * 1000) {
                        recentUserActivity.push({
                            userName,
                            action: 'verified their email',
                            type: 'success',
                            details: '',
                            timestamp: user.updatedAt
                        });
                    }

                    // Recent password reset request (within last 24 hours)
                    if (user.resetPasswordToken &&
                        Math.abs(now - user.updatedAt) < 24 * 60 * 60 * 1000) {
                        recentUserActivity.push({
                            userName,
                            action: 'requested password reset',
                            type: 'warning',
                            details: '',
                            timestamp: user.updatedAt
                        });
                    }
                });

                // Sort by timestamp and take most recent
                const sortedActivity = recentUserActivity
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit)
                    .map(activity => ({
                        ...activity,
                        timeAgo: this.getTimeAgo(activity.timestamp)
                    }));

                const activity = {
                    recentUsers: recentUsers.map(user => ({
                        ...user,
                        timeAgo: this.getTimeAgo(user.createdAt)
                    })),
                    recentUserActivity: sortedActivity
                };

                logger.debug('Recent activity retrieved');
                return activity;
            } catch (dbError) {
                logger.warn('Database query failed for recent activity, returning empty arrays:', dbError.message);
                return {
                    recentUsers: [],
                    recentUserActivity: []
                };
            }

        } catch (error) {
            logger.error('Error getting recent activity:', error);
            throw new Error('Failed to get recent activity');
        }
    }

    /**
     * Helper function to get time ago string
     */
    static getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    /**
     * Dashboard Data Aggregator
     * Combines all analytics data for dashboard display
     */
    static async getDashboardData() {
        try {
            logger.debug('Aggregating dashboard data...');

            const [systemMetrics, userAnalytics, monthlyGrowth, apiAnalytics, apiSchemaAnalytics, recentActivity] = await Promise.all([
                this.getSystemMetrics(),
                this.getUserAnalytics('24h'),
                this.getMonthlyUserGrowth().catch(() => []),
                this.getApiAnalytics('24h').catch(() => ({
                    totalRequests: 0,
                    avgResponseTime: 0,
                    errorCount: 0,
                    errorRate: 0,
                    cachedRequests: 0,
                    cacheRate: 0
                })),
                this.getApiSchemaAnalytics().catch(() => ({
                    prismaModels: 0,
                    restEndpoints: 0,
                    graphqlQueries: 0,
                    graphqlMutations: 0,
                    graphqlSubscriptions: 0,
                    totalGraphqlOperations: 0,
                    totalApiEndpoints: 0
                })),
                this.getRecentActivity(5).catch(() => ({
                    recentUsers: [],
                    recentApiCalls: []
                }))
            ]);

            const dashboard = {
                system: systemMetrics,
                users: userAnalytics.summary,
                monthlyGrowth: monthlyGrowth,
                api: apiAnalytics,
                apiSchema: apiSchemaAnalytics,
                activity: recentActivity,
                generatedAt: new Date().toISOString()
            };

            logger.debug('Dashboard data aggregated');
            return dashboard;

        } catch (error) {
            logger.error('Error aggregating dashboard data:', error);
            throw new Error('Failed to aggregate dashboard data');
        }
    }
}
