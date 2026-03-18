/**
 * Tests for session routes.
 * Uses a real Redis connection via environment variable REDIS_HOST.
 */

'use strict';

const request = require('supertest');
const app = require('../server');
const redis = require('../redis');

afterAll(async () => {
  await redis.quit();
});

describe('POST /api/session', () => {
  it('creates a new session and returns sessionId + name', async () => {
    const res = await request(app)
      .post('/api/session')
      .send({ name: 'TestPlayer' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('sessionId');
    expect(res.body.name).toBe('TestPlayer');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/session').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when name is empty string', async () => {
    const res = await request(app).post('/api/session').send({ name: '   ' });
    expect(res.status).toBe(400);
  });

  it('truncates name to 20 characters', async () => {
    const longName = 'A'.repeat(30);
    const res = await request(app)
      .post('/api/session')
      .send({ name: longName });

    expect(res.status).toBe(201);
    expect(res.body.name.length).toBeLessThanOrEqual(20);
  });

  it('restores existing session when valid cookie is sent', async () => {
    // First request — create session
    const createRes = await request(app)
      .post('/api/session')
      .send({ name: 'CookiePlayer' });

    expect(createRes.status).toBe(201);
    const { sessionId } = createRes.body;
    const cookies = createRes.headers['set-cookie'];

    // Second request — restore session using the same cookie
    const restoreRes = await request(app)
      .post('/api/session')
      .set('Cookie', cookies)
      .send({ name: 'DifferentName' });

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.sessionId).toBe(sessionId);
    expect(restoreRes.body.name).toBe('CookiePlayer');
  });
});

describe('GET /api/session/:id', () => {
  it('returns session data for a valid sessionId', async () => {
    const createRes = await request(app)
      .post('/api/session')
      .send({ name: 'GetPlayer' });

    const { sessionId } = createRes.body;

    const res = await request(app).get(`/api/session/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('GetPlayer');
    expect(res.body.sessionId).toBe(sessionId);
  });

  it('returns 404 for unknown sessionId', async () => {
    const res = await request(app).get('/api/session/nonexistent-id-xyz');
    expect(res.status).toBe(404);
  });
});
