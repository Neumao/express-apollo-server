import { AnalyticsService } from './src/express/services/analyticsService.js';

async function testAnalytics() {
    try {
        console.log('Testing analytics methods...\n');

        // Test Advanced Analytics
        console.log('=== Advanced Analytics ===');
        const advanced = await AnalyticsService.getAdvancedAnalytics();
        console.log('Request Patterns:', advanced.requestPatterns);
        console.log('Anomaly Status:', advanced.anomalyStatus);
        console.log('Cost Estimate:', advanced.costEstimate);
        console.log('SLA Compliance:', advanced.slaCompliance);
        console.log('Has Anomalies:', advanced.hasAnomalies);
        console.log('SLA Compliant:', advanced.slaCompliant);

        // Test Business Analytics
        console.log('\n=== Business Analytics ===');
        const business = await AnalyticsService.getBusinessAnalytics();
        console.log('User Engagement Score:', business.userEngagementScore);
        console.log('Top Region:', business.topRegion);
        console.log('Top Device:', business.topDevice);
        console.log('API Versions:', business.apiVersions);

        // Test Performance Analytics
        console.log('\n=== Performance Analytics ===');
        const performance = await AnalyticsService.getPerformanceAnalytics();
        console.log('95th Percentile:', performance.p95ResponseTime + 'ms');
        console.log('Peak Response Time:', performance.peakResponseTime + 'ms');
        console.log('Response Distribution:', `${performance.fastRequests}/${performance.mediumRequests}/${performance.slowRequests}`);
        console.log('Requests/Second:', performance.requestsPerSecond);

        // Test Traffic Analytics
        console.log('\n=== Traffic Analytics ===');
        const traffic = await AnalyticsService.getTrafficAnalytics();
        console.log('Requests/Hour:', traffic.requestsPerHour);
        console.log('Peak Hour:', traffic.peakHour);
        console.log('API vs GraphQL:', `${traffic.restRequests}/${traffic.graphqlRequests}`);
        console.log('Most Active User:', traffic.mostActiveUser);

        // Test Dashboard Data
        console.log('\n=== Dashboard Data Aggregation ===');
        const dashboard = await AnalyticsService.getDashboardData();
        console.log('Dashboard keys:', Object.keys(dashboard));
        console.log('Advanced data present:', !!dashboard.advanced);
        console.log('Business data present:', !!dashboard.business);
        console.log('Performance data present:', !!dashboard.performance);
        console.log('Traffic data present:', !!dashboard.traffic);

    } catch (error) {
        console.error('Error testing analytics:', error);
    }
}

testAnalytics();