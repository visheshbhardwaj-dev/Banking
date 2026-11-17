const Redis = require('ioredis');

// BullMQ workers refuse to start unless this is null
const options = { maxRetriesPerRequest: null };

const redisConnection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, options)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ...options,
    });

redisConnection.on('connect', () => {
  console.log('Successfully connected to Redis');
});

redisConnection.on('error', (err) => {
  console.error('Redis error:', err);
});

module.exports = redisConnection;