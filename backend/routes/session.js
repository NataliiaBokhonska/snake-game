/**
 * Session routes
 * POST /api/session  — create or restore a session
 * GET  /api/session/:id — get session data
 */

'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const redis = require('../redis');

const router = Router();

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds
const COOKIE_NAME = 'sessionId';

/**
 * POST /api/session
 * Body: { name: string }
 * Creates a new session (or returns existing one if cookie present).
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const sanitizedName = name.trim().slice(0, 20);

    // Check for existing session via cookie
    let sessionId = req.cookies[COOKIE_NAME];

    if (sessionId) {
      const existing = await redis.get(`session:${sessionId}`);
      if (existing) {
        const session = JSON.parse(existing);
        // Refresh TTL
        await redis.expire(`session:${sessionId}`, SESSION_TTL);
        return res.json({ sessionId, name: session.name });
      }
    }

    // Create new session
    sessionId = uuidv4();
    const session = {
      name: sanitizedName,
      createdAt: new Date().toISOString(),
    };

    await redis.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      'EX',
      SESSION_TTL,
    );

    res.cookie(COOKIE_NAME, sessionId, {
      httpOnly: true,
      maxAge: SESSION_TTL * 1000,
    });

    return res.status(201).json({ sessionId, name: sanitizedName });
  } catch (err) {
    console.error('POST /api/session error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/session/:id
 * Returns session data for the given sessionId.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await redis.get(`session:${id}`);

    if (!data) {
      return res.status(404).json({ error: 'session not found' });
    }

    const session = JSON.parse(data);
    return res.json({ sessionId: id, ...session });
  } catch (err) {
    console.error('GET /api/session/:id error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
