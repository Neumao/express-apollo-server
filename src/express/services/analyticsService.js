import os from 'os';
import process from 'process';
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
                    cachedRequests
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
                    })
                ]);

                const analytics = {
                    totalRequests: totalRequests,
                    avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
                    errorCount: errorCount,
                    errorRate: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 100) : 0,
                    cachedRequests: cachedRequests,
                    cacheRate: totalRequests > 0 ? Math.round((cachedRequests / totalRequests) * 100) : 0
                };

                logger.debug('API analytics retrieved');
                return analytics;
            } catch (dbError) {
                logger.warn('Database query failed for API analytics, returning defaults:', dbError.message);
                return {
                    totalRequests: 0,
                    avgResponseTime: 0,
                    errorCount: 0,
                    errorRate: 0,
                    cachedRequests: 0,
                    cacheRate: 0
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
     * Get Security Analytics
     * Returns authentication and security-related metrics
     */
    static async getSecurityAnalytics(timeRange = '24h') {
        try {
            logger.debug('Getting security analytics...');

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
                    failedLoginAttempts,
                    passwordResetRequests,
                    emailVerifications
                ] = await Promise.all([
                    prisma.user.aggregate({
                        _sum: { failedLoginAttempts: true }
                    }).catch(() => ({ _sum: { failedLoginAttempts: 0 } })),
                    prisma.user.count({
                        where: {
                            resetPasswordToken: { not: null }
                        }
                    }),
                    prisma.user.count({
                        where: {
                            emailVerificationToken: { not: null }
                        }
                    })
                ]);

                const analytics = {
                    failedLoginAttempts: failedLoginAttempts._sum.failedLoginAttempts || 0,
                    passwordResetRequests: passwordResetRequests,
                    emailVerifications: emailVerifications,
                    totalSecurityEvents: (failedLoginAttempts._sum.failedLoginAttempts || 0) + passwordResetRequests + emailVerifications
                };

                logger.debug('Security analytics retrieved');
                return analytics;
            } catch (dbError) {
                logger.warn('Database query failed for security analytics, returning defaults:', dbError.message);
                return {
                    failedLoginAttempts: 0,
                    passwordResetRequests: 0,
                    emailVerifications: 0,
                    totalSecurityEvents: 0
                };
            }

        } catch (error) {
            logger.error('Error getting security analytics:', error);
            throw new Error('Failed to get security analytics');
        }
    }

    /**
     * Get Recent Activity
     * Returns latest user registrations and API calls
     */
    static async getRecentActivity(limit = 5) {
        try {
            logger.debug('Getting recent activity...');

            try {
                const [recentUsers, recentApiCalls] = await Promise.all([
                    prisma.user.findMany({
                        select: {
                            id: true,
                            email: true,
                            createdAt: true,
                            isVerified: true
                        },
                        orderBy: { createdAt: 'desc' },
                        take: limit
                    }).catch(() => []),
                    prisma.apiRequest.findMany({
                        select: {
                            id: true,
                            endpoint: true,
                            method: true,
                            statusCode: true,
                            timestamp: true
                        },
                        orderBy: { timestamp: 'desc' },
                        take: limit
                    }).catch(() => [])
                ]);

                const activity = {
                    recentUsers: recentUsers.map(user => ({
                        ...user,
                        timeAgo: this.getTimeAgo(user.createdAt)
                    })),
                    recentApiCalls: recentApiCalls.map(call => ({
                        ...call,
                        timeAgo: this.getTimeAgo(call.timestamp)
                    }))
                };

                logger.debug('Recent activity retrieved');
                return activity;
            } catch (dbError) {
                logger.warn('Database query failed for recent activity, returning empty arrays:', dbError.message);
                return {
                    recentUsers: [],
                    recentApiCalls: []
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

            const [systemMetrics, userAnalytics, monthlyGrowth, apiAnalytics, securityAnalytics, recentActivity] = await Promise.all([
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
                this.getSecurityAnalytics('24h').catch(() => ({
                    failedLoginAttempts: 0,
                    passwordResetRequests: 0,
                    emailVerifications: 0,
                    totalSecurityEvents: 0
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
                security: securityAnalytics,
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
