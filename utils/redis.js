import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // Create a new Redis client
    this.client = redis.createClient();

    // Listen for errors and log them to the console
    this.client.on('error', (err) => {
      console.error('Redis Error:', err);
    })
