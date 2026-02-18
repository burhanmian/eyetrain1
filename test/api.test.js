const request = require('supertest');
const app = require('../server/index');

describe('API Health Check', () => {
  test('GET /api/health should return OK status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('Photo Upload Endpoint', () => {
  test('POST /api/upload-photo should reject request without file', async () => {
    const response = await request(app).post('/api/upload-photo');
    expect(response.status).toBe(400);
  });
});

describe('Default Models Endpoint', () => {
  test('GET /api/default-models should return models array', async () => {
    const response = await request(app).get('/api/default-models');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
