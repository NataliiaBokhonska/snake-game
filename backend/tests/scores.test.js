/**
 * Tests for scores routes.
 */

'use strict';

const request = require('supertest');
const app = require('../server');
const redis = require('../redis');

const TEST_SESSION = 'test-session-scores-001';
const TEST_NAME = 'ScorePlayer';

beforeAll(async () => {
  // Clean up leaderboard entries from previous test runs
  await redis.zrem('highscores', `${TEST_SESSION}:${TEST_NAME}`);
});

afterAll(async () => {
  await redis.zrem('highscores', `${TEST_SESSION}:${TEST_NAME}`);
  await redis.quit();
});

describe('POST /api/scores', () => {
  it('saves a valid score and returns 201', async () => {
    const res = await request(app).post('/api/scores').send({
      sessionId: TEST_SESSION,
      name: TEST_NAME,
      score: 10,
    });

    expect(res.status).toBe(201);
    expect(res.body.saved).toBe(true);
  });

  it('returns 400 when score is missing', async () => {
    const res = await request(app).post('/api/scores').send({
      sessionId: TEST_SESSION,
      name: TEST_NAME,
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative score', async () => {
    const res = await request(app).post('/api/scores').send({
      sessionId: TEST_SESSION,
      name: TEST_NAME,
      score: -5,
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-integer score', async () => {
    const res = await request(app).post('/api/scores').send({
      sessionId: TEST_SESSION,
      name: TEST_NAME,
      score: 3.5,
    });
    expect(res.status).toBe(400);
  });

  it('only keeps the highest score per player', async () => {
    // Save a lower score
    await request(app).post('/api/scores').send({
      sessionId: TEST_SESSION,
      name: TEST_NAME,
      score: 5,
    });

    // The stored score should still be 10 (from first test)
    const storedScore = await redis.zscore(
      'highscores',
      `${TEST_SESSION}:${TEST_NAME}`,
    );
    expect(parseFloat(storedScore)).toBe(10);
  });

  it('updates score when new score is higher', async () => {
    await request(app).post('/api/scores').send({
      sessionId: TEST_SESSION,
      name: TEST_NAME,
      score: 99,
    });

    const storedScore = await redis.zscore(
      'highscores',
      `${TEST_SESSION}:${TEST_NAME}`,
    );
    expect(parseFloat(storedScore)).toBe(99);
  });
});

describe('GET /api/scores/top', () => {
  it('returns an array', async () => {
    const res = await request(app).get('/api/scores/top');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('contains the score we saved', async () => {
    const res = await request(app).get('/api/scores/top');
    const entry = res.body.find((e) => e.name === TEST_NAME);
    expect(entry).toBeDefined();
    expect(entry.score).toBe(99);
  });

  it('returns at most 10 entries', async () => {
    const res = await request(app).get('/api/scores/top');
    expect(res.body.length).toBeLessThanOrEqual(10);
  });

  it('returns entries in descending score order', async () => {
    const res = await request(app).get('/api/scores/top');
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i - 1].score).toBeGreaterThanOrEqual(res.body[i].score);
    }
  });
});
