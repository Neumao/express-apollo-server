#!/usr/bin/env node

/**
 * Test script for enhanced analytics logs functionality
 * This script tests the new log type and date filtering capabilities
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

async function testLogFilesInfo() {
    try {
        console.log('🔍 Testing /api/analytics/logs/info endpoint...');

        const response = await fetch(`${BASE_URL}/api/analytics/logs/info`);
        const result = await response.json();

        if (response.ok) {
            console.log('✅ Log files info endpoint working');
            console.log('📁 Available log types:', result.data.availableTypes);
            console.log('📅 Available dates:', result.data.availableDates);
            console.log('📊 Total files found:', result.data.totalFiles);
            return result.data;
        } else {
            console.error('❌ Log files info endpoint failed:', result.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Error testing log files info:', error.message);
        return null;
    }
}

async function testEnhancedLogs(logType = '', logDate = '', level = '') {
    try {
        console.log(`\\n🔍 Testing enhanced logs with filters:`, {
            logType: logType || 'all',
            logDate: logDate || 'latest',
            level: level || 'all'
        });

        const params = new URLSearchParams();
        params.append('limit', '5'); // Small limit for testing
        if (logType) params.append('logType', logType);
        if (logDate) params.append('logDate', logDate);
        if (level) params.append('level', level);

        const url = `${BASE_URL}/api/analytics/logs?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok) {
            console.log('✅ Enhanced logs endpoint working');
            console.log('📝 Logs found:', result.data.logs.length);
            console.log('🏷️  Metadata:', result.data.meta);

            if (result.data.logs.length > 0) {
                console.log('📄 Sample log entry:', {
                    timestamp: result.data.logs[0].timestamp,
                    level: result.data.logs[0].level,
                    message: result.data.logs[0].message.substring(0, 100) + '...'
                });
            }
            return true;
        } else {
            console.error('❌ Enhanced logs endpoint failed:', result.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing enhanced logs:', error.message);
        return false;
    }
}

async function testDashboard() {
    try {
        console.log('\\n🔍 Testing analytics dashboard...');

        const response = await fetch(`${BASE_URL}/api/analytics`);

        if (response.ok) {
            const html = await response.text();
            const hasLogTypeSelect = html.includes('id="log-type"');
            const hasLogDateSelect = html.includes('id="log-date"');

            console.log('✅ Dashboard accessible');
            console.log('🎛️  Has log type selector:', hasLogTypeSelect ? '✅' : '❌');
            console.log('📅 Has log date selector:', hasLogDateSelect ? '✅' : '❌');

            return hasLogTypeSelect && hasLogDateSelect;
        } else {
            console.error('❌ Dashboard not accessible');
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing dashboard:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Enhanced Analytics Logs Tests\\n');

    // Test 1: Log files info endpoint
    const logFilesInfo = await testLogFilesInfo();

    // Test 2: Enhanced logs with no filters
    await testEnhancedLogs();

    // Test 3: Enhanced logs with log type filter
    if (logFilesInfo && logFilesInfo.availableTypes && logFilesInfo.availableTypes.length > 0) {
        await testEnhancedLogs(logFilesInfo.availableTypes[0]);
    }

    // Test 4: Enhanced logs with date filter
    if (logFilesInfo && logFilesInfo.availableDates && logFilesInfo.availableDates.length > 0) {
        await testEnhancedLogs('', logFilesInfo.availableDates[0]);
    }

    // Test 5: Enhanced logs with level filter
    await testEnhancedLogs('', '', 'INFO');

    // Test 6: Dashboard UI enhancements
    await testDashboard();

    console.log('\\n🎯 Test suite completed!');
    console.log('\\n💡 To view the enhanced dashboard, visit: http://localhost:3000/api/analytics');
}

// Handle server not running
process.on('unhandledRejection', (error) => {
    if (error.code === 'ECONNREFUSED') {
        console.error('❌ Server not running. Please start the server first with: npm start');
        process.exit(1);
    }
});

runTests().catch(console.error);