const request = require('supertest');
const express = require('express');

// Mock express server for testing
const app = express();
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint working!' });
});

describe('Basic Express Server', () => {
  it('should respond with 200 status code for test endpoint', async () => {
    const response = await request(app).get('/test');
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Test endpoint working!');
  });
});

describe('Environment configuration', () => {
  it('should load environment variables', () => {
    // This test will ensure your environment setup works
    // when you run the tests with proper environment variables
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
