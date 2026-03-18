/**
 * Snake Game — Express backend
 * Provides session management and highscore persistence via Redis.
 */

'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const sessionRouter = require('./routes/session');
const scoresRouter = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/session', sessionRouter);
app.use('/api/scores', scoresRouter);

/** Health-check endpoint */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Snake backend listening on port ${PORT}`);
  });
}

module.exports = app;
