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
     * Dashboard Data Aggregator
     * Combines all analytics data for dashboard display
     */
    static async getDashboardData() {
        try {
            logger.debug('Aggregating dashboard data...');

            const [systemMetrics, userAnalytics] = await Promise.all([
                this.getSystemMetrics(),
                this.getUserAnalytics('24h')
            ]);

            const dashboard = {
                system: systemMetrics,
                users: userAnalytics.summary,
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
