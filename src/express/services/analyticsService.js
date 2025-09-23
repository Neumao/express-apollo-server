import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import process from 'process';
import prisma from '../../../prisma/client.js';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
import { logger } from '../../config/logger.js';

/**
 * Analytics Service
 * Handles all analytics-related business logic
 */
export class AnalyticsService {
    /**
     * Get system metrics
     * @returns {Promise<Object>} System metrics data
     */
    static async getSystemMetrics() {
        try {
            logger.debug('Collecting system metrics...');

            const memoryUsage = process.memoryUsage();
            const cpus = os.cpus();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();

            // Calculate CPU usage (average across cores)
            let cpuUsage = 0;
            try {
                logger.debug('CPU Info:', { cpus: cpus.map(cpu => cpu.times) });

                cpuUsage = cpus.reduce((acc, cpu) => {
                    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
                    const idle = cpu.times.idle;
                    const usage = ((total - idle) / total) * 100;
                    logger.debug('CPU Core Usage:', { total, idle, usage });
                    return acc + usage;
                }, 0) / (cpus.length || 1);

                logger.debug('Final CPU Usage:', { cpuUsage, cores: cpus.length });
            } catch (cpuError) {
                logger.error('Error calculating CPU usage:', cpuError);
            }

            const metrics = {
                memory: {
                    heapUsed: Math.round((memoryUsage.heapUsed || 0) / 1024 / 1024),
                    heapTotal: Math.round((memoryUsage.heapTotal || 0) / 1024 / 1024),
                    rss: Math.round((memoryUsage.rss || 0) / 1024 / 1024),
                    external: Math.round((memoryUsage.external || 0) / 1024 / 1024),
                    usedSystem: Math.round((totalMem - freeMem) / 1024 / 1024),
                    freeSystem: Math.round(freeMem / 1024 / 1024),
                    totalSystem: Math.round(totalMem / 1024 / 1024),
                    usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100)
                },
                cpu: {
                    usage: Math.round(cpuUsage * 100) / 100, // Keep 2 decimal places
                    cores: cpus.length,
                    model: cpus[0]?.model || 'Unknown',
                    speed: cpus[0]?.speed || 0,
                    uptime: Math.round(os.uptime() / 3600)
                },
                process: {
                    uptime: process.uptime(),  // Raw uptime in seconds
                    uptimeMinutes: Math.floor(process.uptime() / 60),
                    uptimeHours: Math.floor(process.uptime() / 3600),
                    pid: process.pid,
                    version: process.version
                }
            };

            logger.debug('Raw System Metrics:', {
                memoryUsage,
                cpuUsage,
                cpus: cpus.length,
                totalMem,
                freeMem,
                uptime: {
                    os: os.uptime(),
                    process: process.uptime()
                }
            });

            logger.debug('Processed System Metrics:', metrics);

            logger.debug('System metrics collected successfully');
            return metrics;
        } catch (error) {
            logger.error('Critical error getting system metrics:', error);
            return {
                memory: {
                    heapUsed: 0, heapTotal: 0, rss: 0, external: 0,
                    usedSystem: 0, freeSystem: 0, totalSystem: 0, usagePercent: 0
                },
                cpu: {
                    usage: 0, cores: 1, model: 'Unknown', speed: 0, uptime: 0
                },
                process: {
                    uptime: 0, pid: process.pid, version: process.version
                }
            };
        }
    }

    /**
     * Get system health status
     * @returns {Promise<Object>} System health information
     */
    static async getSystemHealth() {
        try {
            const health = {
                status: 'healthy',
                checks: {},
                timestamp: new Date().toISOString()
            };

            // Database health check
            try {
                await prisma.$queryRaw`SELECT 1`;
                health.checks.database = { status: 'healthy', responseTime: 'fast' };
            } catch (error) {
                health.checks.database = { status: 'unhealthy', error: error.message };
                health.status = 'degraded';
            }

            // Memory health check
            const memoryUsage = process.memoryUsage();
            const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            health.checks.memory = {
                status: heapUsedPercent > 90 ? 'warning' : 'healthy',
                heapUsedPercent: Math.round(heapUsedPercent),
                heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024)
            };

            // Uptime check
            const uptimeHours = process.uptime() / 3600;
            health.checks.uptime = {
                status: 'healthy',
                hours: Math.round(uptimeHours * 100) / 100
            };

            return health;
        } catch (error) {
            logger.error('Error checking system health:', error);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get last 7 days labels for charts
     * @returns {string[]} Array of date labels
     */
    static getLast7DaysLabels() {
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return labels;
    }

    /**
     * Get last 24 hours labels for charts
     * @returns {string[]} Array of hour labels
     */
    static getLast24HoursLabels() {
        const labels = [];
        for (let i = 23; i >= 0; i--) {
            const hour = new Date();
            hour.setHours(hour.getHours() - i);
            labels.push(hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }));
        }
        return labels;
    }

    /**
     * Get user growth data for the last 7 days
     * @returns {Promise<number[]>} Array of daily user counts
     */
    static async getUserGrowthData() {
        try {
            const data = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

                const count = await prisma.user.count({
                    where: {
                        createdAt: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                });
                data.push(count);
            }
            return data;
        } catch (error) {
            logger.error('Error fetching user growth data:', error);
            return Array(7).fill(0);
        }
    }

    /**
     * Get comprehensive dashboard data
     * @returns {Promise<Object>} Complete dashboard data
     */
    static async getDashboardData() {
        try {
            const startTime = Date.now();
            logger.info('Starting dashboard data collection');

            // Initialize dates
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Initialize API stats
            let apiStats = {
                totalRequests: 0,
                avgResponseTime: 0,
                errorRate: 0,
                successRate: 100,
                requestsPerHour: Array(24).fill(0),
                recentResponseTimes: Array(24).fill(50),
                topEndpoints: []
            };

            // Log initial state
            logger.debug('Initializing API stats with default values');

            // Calculate real-time metrics from database
            try {
                const now = new Date();
                const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                logger.debug('Fetching API requests from last 24 hours...');
                // Get requests from the last 24 hours with detailed logging
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
                        timestamp: true,
                        userId: true
                    },
                    orderBy: {
                        timestamp: 'desc'
                    }
                });
                logger.debug(`Found ${requests.length} API requests`);
                logger.debug('Sample of recent requests:', requests.slice(0, 5));

                if (requests.length > 0) {
                    // Calculate total requests and error rates
                    const totalRequests = requests.length;
                    const errorRequests = requests.filter(r => r.statusCode >= 400).length;
                    const errorRate = (errorRequests / totalRequests) * 100;
                    const successRate = 100 - errorRate;

                    // Calculate average response time
                    const totalResponseTime = requests.reduce((sum, r) => sum + r.responseTime, 0);
                    const avgResponseTime = totalResponseTime / totalRequests;

                    // Calculate requests per hour
                    const requestsPerHour = Array(24).fill(0);
                    requests.forEach(request => {
                        const hoursDiff = Math.floor((now - new Date(request.timestamp)) / (1000 * 60 * 60));
                        if (hoursDiff >= 0 && hoursDiff < 24) {
                            requestsPerHour[23 - hoursDiff]++;
                        }
                    });

                    // Calculate recent response times (average per hour)
                    const responseTimesPerHour = Array(24).fill().map(() => []);
                    requests.forEach(request => {
                        const hoursDiff = Math.floor((now - new Date(request.timestamp)) / (1000 * 60 * 60));
                        if (hoursDiff >= 0 && hoursDiff < 24) {
                            responseTimesPerHour[23 - hoursDiff].push(request.responseTime);
                        }
                    });

                    logger.debug('Response times by hour:', responseTimesPerHour.map((times, i) => ({
                        hour: i,
                        count: times.length,
                        avg: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null
                    })));
                    const recentResponseTimes = responseTimesPerHour.map(times =>
                        times.length > 0
                            ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
                            : null
                    );

                    // Get top endpoints
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

                    apiStats = {
                        totalRequests,
                        avgResponseTime: Math.round(avgResponseTime),
                        errorRate: Math.round(errorRate * 100) / 100,
                        successRate: Math.round(successRate * 100) / 100,
                        requestsPerHour,
                        recentResponseTimes: recentResponseTimes.map(t => t || 50),
                        topEndpoints
                    };
                }
            } catch (error) {
                logger.error('Failed to calculate real-time metrics:', error);
                logger.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                logger.warn('Using default API stats due to error');
            }

            // Collect all required data with timeout
            const timeout = 30000;
            const [userMetrics, recentUsers, systemMetrics, healthCheck] = await Promise.all([
                Promise.race([
                    prisma.$transaction([
                        prisma.user.count(),
                        prisma.user.count({ where: { updatedAt: { gte: lastDay } } }),
                        prisma.user.count({ where: { isVerified: true } }),
                        prisma.user.count({ where: { isVerified: false } }),
                        prisma.user.count({ where: { createdAt: { gte: today } } })
                    ]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('User metrics timeout')), timeout))
                ]).catch(error => {
                    logger.error('Failed to fetch user metrics:', error);
                    return [0, 0, 0, 0, 0];
                }),
                Promise.race([
                    prisma.user.findMany({
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            email: true,
                            isVerified: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Recent users timeout')), timeout))
                ]).catch(() => []),
                this.getSystemMetrics(),
                this.getSystemHealth()
            ]);

            // Extract user metrics with validation
            console.log('User metrics raw data:', userMetrics);
            const [totalUsers, activeUsers, verifiedUsers, unverifiedUsers, newUsersToday] =
                userMetrics.map(v => Math.max(0, v || 0));

            logger.debug('User metrics:', {
                totalUsers,
                activeUsers,
                verifiedUsers,
                unverifiedUsers,
                newUsersToday
            });

            // Get chart data
            const last7Days = this.getLast7DaysLabels();
            const last24Hours = this.getLast24HoursLabels();
            const userGrowthData = await this.getUserGrowthData();

            logger.debug('Chart data:', {
                last7Days,
                last24Hours,
                userGrowthData
            });

            logger.debug('API Stats:', apiStats);

            // Log system metrics before mapping
            logger.debug('System metrics for dashboard:', {
                memory: systemMetrics?.memory,
                cpu: systemMetrics?.cpu,
                process: systemMetrics?.process
            });

            // Construct dashboard data
            const dashboard = {
                metrics: {
                    // User metrics
                    totalUsers,
                    activeUsers,
                    verifiedUsers,
                    unverifiedUsers,
                    newUsersToday,

                    // API metrics
                    totalQueries: apiStats.totalRequests,
                    avgResponseTime: apiStats.avgResponseTime,
                    errorRate: apiStats.errorRate,
                    successRate: apiStats.successRate,

                    // System metrics
                    memoryUsage: Math.round(systemMetrics?.memory?.usagePercent || 0),
                    cpuUsage: Math.round((systemMetrics?.cpu?.usage || 0) * 10) / 10, // One decimal place
                    cpuCores: systemMetrics?.cpu?.cores || 1,
                    processUptimeMinutes: Math.max(1, Math.floor(systemMetrics?.process?.uptimeMinutes || 0)),
                    systemUptimeHours: Math.max(1, Math.floor(systemMetrics?.process?.uptimeHours || 0)),
                    memoryUsageMB: systemMetrics?.memory?.usedSystem || 0,
                    memoryTotalMB: systemMetrics?.memory?.totalSystem || 0,
                    memoryFreeMB: systemMetrics?.memory?.freeSystem || 0,
                    processMemoryMB: systemMetrics?.memory?.heapUsed || 0,
                    cpuUsage: systemMetrics?.cpu?.usage || 0,
                    cpuCores: systemMetrics?.cpu?.cores || 1,
                    processUptimeMinutes: systemMetrics?.process?.uptime || 0,
                    systemUptimeHours: systemMetrics?.cpu?.uptime || 0,
                    diskUsage: 68
                },
                chartData: {
                    userGrowth: {
                        labels: last7Days,
                        data: userGrowthData
                    },
                    apiRequests: {
                        labels: last24Hours,
                        data: apiStats.requestsPerHour
                    },
                    responseTime: {
                        labels: last24Hours,
                        data: apiStats.recentResponseTimes
                    },
                    userActivity: {
                        labels: ['Active', 'Inactive', 'New', 'Verified'],
                        data: [
                            activeUsers,
                            Math.max(0, totalUsers - activeUsers),
                            newUsersToday,
                            verifiedUsers
                        ]
                    }
                },
                recentUsers,
                systemHealth: healthCheck,
                timestamp: new Date().toISOString()
            };

            const duration = Date.now() - startTime;
            logger.info(`Dashboard data collected in ${duration}ms`);
            return dashboard;
        } catch (error) {
            logger.error('Critical error fetching dashboard data:', error);
            return {
                metrics: {
                    totalUsers: 0, activeUsers: 0, verifiedUsers: 0,
                    unverifiedUsers: 0, newUsersToday: 0, totalQueries: 0,
                    avgResponseTime: 0, errorRate: 0, successRate: 100,
                    memoryUsage: 0, memoryUsageMB: 0, memoryTotalMB: 0,
                    memoryFreeMB: 0, processMemoryMB: 0, cpuUsage: 0,
                    cpuCores: 1, processUptimeMinutes: 0,
                    systemUptimeHours: 0, diskUsage: 0
                },
                chartData: {
                    userGrowth: {
                        labels: this.getLast7DaysLabels(),
                        data: Array(7).fill(0)
                    },
                    apiRequests: {
                        labels: this.getLast24HoursLabels(),
                        data: Array(24).fill(0)
                    },
                    responseTime: {
                        labels: this.getLast24HoursLabels(),
                        data: Array(24).fill(0)
                    },
                    userActivity: {
                        labels: ['Active', 'Inactive', 'New', 'Verified'],
                        data: [0, 0, 0, 0]
                    }
                },
                recentUsers: [],
                systemHealth: { status: 'error', error: error.message },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get application logs
     * @param {number} limit Maximum number of log entries to return
     * @param {string} level Log level to filter by (error, warn, info, debug)
     * @returns {Promise<Array>} Array of log entries
     */
    static async getApplicationLogs(limit = 100, level = null) {
        try {
            const logDir = path.join(process.cwd(), 'logs');
            const today = new Date().toISOString().split('T')[0];
            const logFiles = [
                `application-${today}.log`,
                `error-${today}.log`
            ];

            let logs = [];
            for (const file of logFiles) {
                try {
                    const filePath = path.join(logDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const lines = content.split('\n')
                        .filter(line => line.trim())
                        .filter(line => !level || line.includes(` ${level}: `))
                        .map(line => {
                            const [timestamp, ...rest] = line.split(' ');
                            return {
                                timestamp: new Date(timestamp).toISOString(),
                                level: rest[0].replace(':', ''),
                                message: rest.slice(1).join(' '),
                                source: file
                            };
                        });
                    logs.push(...lines);
                } catch (error) {
                    logger.warn(`Failed to read log file ${file}:`, error.message);
                }
            }

            // Sort by timestamp descending and limit
            return logs
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            logger.error('Error reading application logs:', error);
            return [];
        }
    }
}
