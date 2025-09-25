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
                    // Calculate 95th percentile response time - simplified for now
                    Promise.resolve(0), // TODO: Implement proper 95th percentile calculation
                    // Calculate time range in minutes for RPM calculation
                    Promise.resolve(Math.max(1, Math.floor((now - startDate) / (1000 * 60))))
                ]);

                const topEndpoint = topEndpointResult.length > 0 ? topEndpointResult[0].endpoint : 'N/A';
                const p95ResponseTime = Math.round(p95ResponseTimeResult || 0);
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
     * Get Advanced Analytics
     * Returns advanced analytics metrics
     */
    static async getAdvancedAnalytics() {
        try {
            logger.debug('Getting advanced analytics...');

            const now = new Date();
            const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            try {
                // Get basic request stats
                const totalRequests = await prisma.apiRequest.count({
                    where: { timestamp: { gte: startDate } }
                }).catch(() => 0);

                const avgResponseTime = await prisma.apiRequest.aggregate({
                    where: { timestamp: { gte: startDate } },
                    _avg: { responseTime: true }
                }).catch(() => ({ _avg: { responseTime: 0 } }));

                // Simple request patterns (just count by hour)
                const requestPatterns = `Total: ${totalRequests} requests in last 24h`;

                // Simple anomaly detection (if requests > 100 in any hour, consider it anomalous)
                const anomalyDetected = totalRequests > 100;

                // Cost analysis ($0.001 per request)
                const costEstimate = `${(totalRequests * 0.001).toFixed(2)}`;

                // SLA compliance (response time < 1000ms)
                const slaCompliance = (avgResponseTime._avg.responseTime || 0) < 1000 ?
                    99 : Math.max(0, 100 - Math.floor((avgResponseTime._avg.responseTime || 0) / 10));

                const analytics = {
                    requestPatterns: requestPatterns,
                    hasAnomalies: anomalyDetected,
                    anomalyStatus: anomalyDetected ? 'High traffic detected' : 'Normal traffic',
                    costEstimate: costEstimate,
                    slaCompliant: (avgResponseTime._avg.responseTime || 0) < 1000,
                    slaCompliance: slaCompliance
                };

                logger.debug('Advanced analytics retrieved');
                return analytics;
            } catch (dbError) {
                logger.warn('Database query failed for advanced analytics, returning defaults:', dbError.message);
                return {
                    requestPatterns: 'N/A',
                    hasAnomalies: false,
                    anomalyStatus: 'Normal',
                    costEstimate: '$0.00',
                    slaCompliant: true,
                    slaCompliance: 100
                };
            }
        } catch (error) {
            logger.error('Error getting advanced analytics:', error);
            throw new Error('Failed to get advanced analytics');
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
     * Get Business Intelligence Analytics
     * Returns business intelligence metrics
     */
    static async getBusinessAnalytics() {
        try {
            logger.debug('Getting business analytics...');

            const now = new Date();
            const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            try {
                const [
                    totalUsers,
                    totalRequests,
                    topRegionData,
                    topDeviceData,
                    apiVersionsData
                ] = await Promise.all([
                    prisma.user.count(),
                    prisma.apiRequest.count({ where: { timestamp: { gte: startDate } } }),
                    // Geographic distribution (simplified - using IP patterns)
                    prisma.apiRequest.groupBy({
                        by: ['ipAddress'],
                        where: { timestamp: { gte: startDate } },
                        _count: { ipAddress: true },
                        orderBy: { _count: { ipAddress: 'desc' } },
                        take: 1
                    }).catch(() => []),
                    // Device/browser breakdown
                    prisma.apiRequest.groupBy({
                        by: ['userAgent'],
                        where: { timestamp: { gte: startDate } },
                        _count: { userAgent: true },
                        orderBy: { _count: { userAgent: 'desc' } },
                        take: 1
                    }).catch(() => []),
                    // API endpoint diversity (count unique endpoints)
                    prisma.apiRequest.groupBy({
                        by: ['endpoint'],
                        where: { timestamp: { gte: startDate } },
                        _count: { endpoint: true }
                    }).catch(() => [])
                ]);

                const userEngagementScore = totalUsers > 0 ? Math.round(totalRequests / totalUsers) : 0;
                const topRegion = topRegionData.length > 0 ?
                    (topRegionData[0].ipAddress === '::1' ? 'Localhost' : topRegionData[0].ipAddress) : 'N/A';
                const topDevice = topDeviceData.length > 0 ?
                    (topDeviceData[0].userAgent?.substring(0, 20) + '...') : 'N/A';
                const apiVersions = apiVersionsData.length;

                return {
                    userEngagementScore,
                    topRegion,
                    topDevice,
                    apiVersions
                };
            } catch (dbError) {
                logger.warn('Database query failed for business analytics, returning defaults:', dbError.message);
                return {
                    userEngagementScore: 0,
                    topRegion: 'N/A',
                    topDevice: 'N/A',
                    apiVersions: 0
                };
            }
        } catch (error) {
            logger.error('Error getting business analytics:', error);
            throw new Error('Failed to get business analytics');
        }
    }

    /**
     * Get Performance Analytics
     * Returns detailed performance metrics
     */
    static async getPerformanceAnalytics() {
        try {
            logger.debug('Getting performance analytics...');

            const now = new Date();
            const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            try {
                const [
                    peakResponseTimeResult,
                    fastRequests,
                    mediumRequests,
                    slowRequests,
                    totalRequests,
                    timeRangeSeconds
                ] = await Promise.all([
                    // Peak response time
                    prisma.apiRequest.aggregate({
                        where: { timestamp: { gte: startDate } },
                        _max: { responseTime: true }
                    }).catch(() => ({ _max: { responseTime: 0 } })),
                    // Fast requests (< 100ms)
                    prisma.apiRequest.count({
                        where: {
                            timestamp: { gte: startDate },
                            responseTime: { lt: 100 }
                        }
                    }).catch(() => 0),
                    // Medium requests (100-999ms)
                    prisma.apiRequest.count({
                        where: {
                            timestamp: { gte: startDate },
                            responseTime: { gte: 100, lt: 1000 }
                        }
                    }).catch(() => 0),
                    // Slow requests (>= 1000ms)
                    prisma.apiRequest.count({
                        where: {
                            timestamp: { gte: startDate },
                            responseTime: { gte: 1000 }
                        }
                    }).catch(() => 0),
                    prisma.apiRequest.count({ where: { timestamp: { gte: startDate } } }),
                    // Time range in seconds for RPS calculation
                    Promise.resolve(Math.max(1, Math.floor((now - startDate) / 1000)))
                ]);

                // Simple approximation for 95th percentile (90th percentile as proxy)
                const p95ResponseTime = Math.round(peakResponseTimeResult._max.responseTime * 0.9 || 0);
                const peakResponseTime = Math.round(peakResponseTimeResult._max.responseTime || 0);
                const requestsPerSecond = Math.round(totalRequests / timeRangeSeconds * 100) / 100;

                return {
                    p95ResponseTime,
                    peakResponseTime,
                    fastRequests,
                    mediumRequests,
                    slowRequests,
                    requestsPerSecond
                };
            } catch (dbError) {
                logger.warn('Database query failed for performance analytics, returning defaults:', dbError.message);
                return {
                    p95ResponseTime: 0,
                    peakResponseTime: 0,
                    fastRequests: 0,
                    mediumRequests: 0,
                    slowRequests: 0,
                    requestsPerSecond: 0
                };
            }
        } catch (error) {
            logger.error('Error getting performance analytics:', error);
            throw new Error('Failed to get performance analytics');
        }
    }

    /**
     * Get Traffic Analytics
     * Returns traffic and usage metrics
     */
    static async getTrafficAnalytics() {
        try {
            logger.debug('Getting traffic analytics...');

            const now = new Date();
            const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            try {
                const [
                    totalRequests,
                    requestsPerHour,
                    peakHourData,
                    restRequests,
                    graphqlRequests,
                    mostActiveUserData
                ] = await Promise.all([
                    prisma.apiRequest.count({ where: { timestamp: { gte: startDate } } }),
                    // Requests per hour calculation
                    Promise.resolve(Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60)))),
                    // Peak hour (simplified - just get the hour with most requests)
                    prisma.apiRequest.groupBy({
                        by: ['timestamp'],
                        where: { timestamp: { gte: startDate } },
                        _count: { timestamp: true },
                        orderBy: { _count: { timestamp: 'desc' } },
                        take: 1
                    }).catch(() => []),
                    // REST requests
                    prisma.apiRequest.count({
                        where: {
                            timestamp: { gte: startDate },
                            endpoint: { startsWith: '/api/' }
                        }
                    }).catch(() => 0),
                    // GraphQL requests
                    prisma.apiRequest.count({
                        where: {
                            timestamp: { gte: startDate },
                            endpoint: { startsWith: '/graphql' }
                        }
                    }).catch(() => 0),
                    // Most active user
                    prisma.apiRequest.groupBy({
                        by: ['userId'],
                        where: { timestamp: { gte: startDate }, userId: { not: null } },
                        _count: { userId: true },
                        orderBy: { _count: { userId: 'desc' } },
                        take: 1
                    }).catch(() => [])
                ]);

                const calculatedRequestsPerHour = Math.round(totalRequests / requestsPerHour);
                const peakHour = peakHourData.length > 0 ?
                    new Date(peakHourData[0].timestamp).getHours() + ':00' : 'N/A';
                const mostActiveUser = mostActiveUserData.length > 0 ?
                    `User ${mostActiveUserData[0].userId}` :
                    `${totalRequests} anonymous requests`;

                return {
                    requestsPerHour: calculatedRequestsPerHour,
                    peakHour,
                    restRequests,
                    graphqlRequests,
                    mostActiveUser
                };
            } catch (dbError) {
                logger.warn('Database query failed for traffic analytics, returning defaults:', dbError.message);
                return {
                    requestsPerHour: 0,
                    peakHour: 'N/A',
                    restRequests: 0,
                    graphqlRequests: 0,
                    mostActiveUser: 'N/A'
                };
            }
        } catch (error) {
            logger.error('Error getting traffic analytics:', error);
            throw new Error('Failed to get traffic analytics');
        }
    }

    /**
     * Dashboard Data Aggregator
     * Combines all analytics data for dashboard display
     */
    static async getDashboardData() {
        try {
            logger.debug('Aggregating dashboard data...');

            const [
                systemMetrics,
                userAnalytics,
                monthlyGrowth,
                apiAnalytics,
                apiSchemaAnalytics,
                advancedAnalytics,
                businessAnalytics,
                performanceAnalytics,
                trafficAnalytics
            ] = await Promise.all([
                this.getSystemMetrics(),
                this.getUserAnalytics('24h'),
                this.getMonthlyUserGrowth().catch(() => []),
                this.getApiAnalytics('24h').catch(() => ({
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
                this.getAdvancedAnalytics().catch(() => ({
                    requestPatterns: 'No data',
                    anomalyDetected: 'No data',
                    costAnalysis: '$0.00',
                    slaCompliance: '0%'
                })),
                this.getBusinessAnalytics().catch(() => ({
                    userEngagementScore: 0,
                    topRegion: 'N/A',
                    topDevice: 'N/A',
                    apiVersions: 0
                })),
                this.getPerformanceAnalytics().catch(() => ({
                    p95ResponseTime: 0,
                    peakResponseTime: 0,
                    fastRequests: 0,
                    mediumRequests: 0,
                    slowRequests: 0,
                    requestsPerSecond: 0
                })),
                this.getTrafficAnalytics().catch(() => ({
                    requestsPerHour: 0,
                    peakHour: 'N/A',
                    restRequests: 0,
                    graphqlRequests: 0,
                    mostActiveUser: 'N/A'
                }))
            ]);

            const dashboard = {
                system: systemMetrics,
                users: userAnalytics.summary,
                monthlyGrowth: monthlyGrowth,
                api: apiAnalytics,
                apiSchema: apiSchemaAnalytics,
                advanced: advancedAnalytics,
                business: businessAnalytics,
                performance: performanceAnalytics,
                traffic: trafficAnalytics,
                generatedAt: new Date().toISOString()
            };

            logger.debug('Dashboard data aggregated');
            return dashboard;

        } catch (error) {
            logger.error('Error aggregating dashboard data:', error);
            throw new Error('Failed to aggregate dashboard data');
        }
    }

    /**
     * Get Detailed API Analytics for dedicated page
     * Returns comprehensive API analytics data
     */
    static async getDetailedApiAnalytics(timeRange = '24h', page = 1, limit = 50) {
        try {
            logger.debug('Getting detailed API analytics...', { timeRange, page, limit });

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
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }

            const skip = (page - 1) * limit;

            // Get paginated API requests
            const [requests, totalCount, stats] = await Promise.all([
                // Paginated requests with details
                prisma.apiRequest.findMany({
                    where: { timestamp: { gte: startDate } },
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        method: true,
                        endpoint: true,
                        responseTime: true,
                        statusCode: true,
                        ipAddress: true,
                        userAgent: true,
                        timestamp: true,
                        userId: true
                    }
                }),
                // Total count for pagination
                prisma.apiRequest.count({
                    where: { timestamp: { gte: startDate } }
                }),
                // Comprehensive stats
                Promise.all([
                    // Response time stats
                    prisma.apiRequest.aggregate({
                        where: { timestamp: { gte: startDate } },
                        _avg: { responseTime: true },
                        _min: { responseTime: true },
                        _max: { responseTime: true }
                    }),
                    // Status code distribution
                    prisma.apiRequest.groupBy({
                        by: ['statusCode'],
                        where: { timestamp: { gte: startDate } },
                        _count: { statusCode: true }
                    }),
                    // Method distribution
                    prisma.apiRequest.groupBy({
                        by: ['method'],
                        where: { timestamp: { gte: startDate } },
                        _count: { method: true }
                    }),
                    // Top endpoints
                    prisma.apiRequest.groupBy({
                        by: ['endpoint'],
                        where: { timestamp: { gte: startDate } },
                        _count: { endpoint: true },
                        orderBy: { _count: { endpoint: 'desc' } },
                        take: 10
                    }),
                    // Hourly distribution
                    prisma.$queryRaw`
                        SELECT
                            EXTRACT(HOUR FROM "timestamp") as hour,
                            COUNT(*) as requests,
                            AVG("responseTime") as avg_response_time
                        FROM "ApiRequest"
                        WHERE "timestamp" >= ${startDate}
                        GROUP BY EXTRACT(HOUR FROM "timestamp")
                        ORDER BY hour
                    `.catch(() => []),
                    // Rate limiting info (simulated)
                    Promise.resolve({
                        currentRequests: Math.floor(Math.random() * 100) + 50,
                        limit: 1000,
                        remaining: Math.floor(Math.random() * 900) + 100,
                        resetTime: new Date(now.getTime() + 60 * 1000)
                    })
                ])
            ]);

            const [responseStats, statusDistribution, methodDistribution, topEndpoints, hourlyData, rateLimit] = stats;

            // Calculate additional metrics
            const totalPages = Math.ceil(totalCount / limit);
            const successRate = statusDistribution.reduce((acc, stat) => {
                return acc + (stat.statusCode >= 200 && stat.statusCode < 300 ? stat._count.statusCode : 0);
            }, 0) / totalCount * 100;

            const errorRate = statusDistribution.reduce((acc, stat) => {
                return acc + (stat.statusCode >= 400 ? stat._count.statusCode : 0);
            }, 0) / totalCount * 100;

            const analytics = {
                requests,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                statistics: {
                    totalRequests: totalCount,
                    avgResponseTime: Math.round(responseStats._avg.responseTime || 0),
                    minResponseTime: Math.round(responseStats._min.responseTime || 0),
                    maxResponseTime: Math.round(responseStats._max.responseTime || 0),
                    successRate: Math.round(successRate * 100) / 100,
                    errorRate: Math.round(errorRate * 100) / 100
                },
                distributions: {
                    statusCodes: statusDistribution.map(s => ({
                        code: s.statusCode,
                        count: s._count.statusCode,
                        percentage: Math.round((s._count.statusCode / totalCount) * 100 * 100) / 100
                    })),
                    methods: methodDistribution.map(m => ({
                        method: m.method,
                        count: m._count.method,
                        percentage: Math.round((m._count.method / totalCount) * 100 * 100) / 100
                    })),
                    topEndpoints: topEndpoints.map(e => ({
                        endpoint: e.endpoint,
                        count: e._count.endpoint,
                        percentage: Math.round((e._count.endpoint / totalCount) * 100 * 100) / 100
                    }))
                },
                hourlyData: hourlyData.map(h => ({
                    hour: h.hour,
                    requests: Number(h.requests),
                    avgResponseTime: Math.round(Number(h.avg_response_time))
                })),
                rateLimit,
                timeRange,
                generatedAt: new Date().toISOString()
            };

            logger.debug('Detailed API analytics retrieved');
            return analytics;

        } catch (error) {
            logger.error('Error getting detailed API analytics:', error);
            throw new Error('Failed to get detailed API analytics');
        }
    }

    /**
     * Get Logs Data for logs page
     * Returns system logs and application logs
     */
    static async getLogsData(logType = 'application', limit = 100) {
        try {
            logger.debug('Getting logs data...', { logType, limit });

            // This is a simplified implementation - in production you'd read from actual log files
            const logs = [];

            // Generate sample logs for demonstration
            const logTypes = {
                application: [
                    { level: 'info', message: 'Server started successfully', timestamp: new Date() },
                    { level: 'debug', message: 'Database connection established', timestamp: new Date(Date.now() - 10000) },
                    { level: 'info', message: 'Analytics data aggregated', timestamp: new Date(Date.now() - 20000) },
                    { level: 'warn', message: 'High memory usage detected', timestamp: new Date(Date.now() - 30000) },
                    { level: 'error', message: 'Failed to connect to external service', timestamp: new Date(Date.now() - 40000) }
                ],
                error: [
                    { level: 'error', message: 'Database connection timeout', timestamp: new Date() },
                    { level: 'error', message: 'Invalid API request format', timestamp: new Date(Date.now() - 15000) },
                    { level: 'error', message: 'Authentication failed', timestamp: new Date(Date.now() - 25000) }
                ],
                access: [
                    { level: 'info', message: 'GET /api/analytics 200', timestamp: new Date() },
                    { level: 'info', message: 'POST /api/auth/login 200', timestamp: new Date(Date.now() - 5000) },
                    { level: 'info', message: 'GET /api/users 401', timestamp: new Date(Date.now() - 10000) }
                ]
            };

            const selectedLogs = logTypes[logType] || logTypes.application;

            // Generate more logs if needed
            while (logs.length < limit && logs.length < 1000) {
                selectedLogs.forEach(log => {
                    if (logs.length < limit) {
                        logs.push({
                            ...log,
                            timestamp: new Date(log.timestamp.getTime() - (logs.length * 60000)),
                            id: `log_${logs.length + 1}`
                        });
                    }
                });
            }

            const data = {
                logs: logs.slice(0, limit),
                totalCount: logs.length,
                logType,
                availableTypes: Object.keys(logTypes),
                generatedAt: new Date().toISOString()
            };

            logger.debug('Logs data retrieved');
            return data;

        } catch (error) {
            logger.error('Error getting logs data:', error);
            throw new Error('Failed to get logs data');
        }
    }
}
