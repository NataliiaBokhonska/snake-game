/**
 * Scores routes
 * POST /api/scores       — save a score
 * GET  /api/scores/top   — get top 10 highscores
 */

'use strict';

const { Router } = require('express');
const redis = require('../redis');

const router = Router();

const LEADERBOARD_KEY = 'highscores';
const TOP_N = 10;

/**
 * POST /api/scores
 * Body: { sessionId: string, name: string, score: number }
 * Saves score to Redis sorted set (highest score per player is kept).
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, name, score } = req.body;

    if (!sessionId || !name || typeof score !== 'number') {
      return res.status(400).json({ error: 'sessionId, name, and score are required' });
    }

    if (score < 0 || !Number.isInteger(score)) {
      return res.status(400).json({ error: 'score must be a non-negative integer' });
    }

    const member = `${sessionId}:${name.trim().slice(0, 20)}`;

    // Only update if new score is higher than existing
    const existing = await redis.zscore(LEADERBOARD_KEY, member);
    if (existing === null || score > parseFloat(existing)) {
      await redis.zadd(LEADERBOARD_KEY, score, member);
    }

    return res.status(201).json({ saved: true });
  } catch (err) {
    console.error('POST /api/scores error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/scores/top
 * Returns top 10 scores as [{ name, score }].
 */
router.get('/top', async (req, res) => {
  try {
    // ZREVRANGE returns members from highest to lowest score
    const raw = await redis.zrevrange(LEADERBOARD_KEY, 0, TOP_N - 1, 'WITHSCORES');

    const scores = [];
    for (let i = 0; i < raw.length; i += 2) {
      const member = raw[i];
      const score = parseInt(raw[i + 1], 10);
      // member format: sessionId:playerName
      const colonIndex = member.indexOf(':');
      const name = colonIndex !== -1 ? member.slice(colonIndex + 1) : member;
      scores.push({ name, score });
    }

    return res.json(scores);
  } catch (err) {
    console.error('GET /api/scores/top error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
