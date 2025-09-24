import prisma from './prisma/client.js';

async function checkData() {
    try {
        console.log('Checking database data for analytics...\n');

        // Check total requests
        const totalRequests = await prisma.apiRequest.count();
        console.log(`Total API requests: ${totalRequests}`);

        // Check recent requests
        const recentRequests = await prisma.apiRequest.findMany({
            take: 5,
            orderBy: { timestamp: 'desc' },
            select: {
                id: true,
                method: true,
                endpoint: true,
                responseTime: true,
                timestamp: true,
                ipAddress: true,
                userAgent: true
            }
        });

        console.log('\nRecent API requests:');
        recentRequests.forEach(req => {
            console.log(`- ${req.method} ${req.endpoint} (${req.responseTime}ms) at ${req.timestamp}`);
        });

        // Check users
        const totalUsers = await prisma.user.count();
        console.log(`\nTotal users: ${totalUsers}`);

        // Check date range
        const dateRange = await prisma.apiRequest.aggregate({
            _min: { timestamp: true },
            _max: { timestamp: true }
        });

        console.log(`\nDate range: ${dateRange._min?.timestamp} to ${dateRange._max?.timestamp}`);

        // Test analytics calculations
        console.log('\nTesting analytics calculations...');

        const now = new Date();
        const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Test advanced analytics
        const totalRequests24h = await prisma.apiRequest.count({
            where: { timestamp: { gte: startDate } }
        });
        console.log(`Requests in last 24h: ${totalRequests24h}`);

        // Test performance analytics
        const avgResponseTime = await prisma.apiRequest.aggregate({
            where: { timestamp: { gte: startDate } },
            _avg: { responseTime: true }
        });
        console.log(`Average response time: ${avgResponseTime._avg.responseTime}ms`);

        // Test traffic analytics
        const restRequests = await prisma.apiRequest.count({
            where: {
                timestamp: { gte: startDate },
                endpoint: { startsWith: '/api/' }
            }
        });
        const graphqlRequests = await prisma.apiRequest.count({
            where: {
                timestamp: { gte: startDate },
                endpoint: { startsWith: '/graphql' }
            }
        });
        console.log(`REST requests: ${restRequests}, GraphQL requests: ${graphqlRequests}`);

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();