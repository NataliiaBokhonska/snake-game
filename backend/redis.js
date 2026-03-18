/**
 * Redis client singleton using ioredis.
 * Connection parameters are read from environment variables.
 */

'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

client.on('error', (err) => {
  console.error('Redis error:', err.message);
});

module.exports = client;
