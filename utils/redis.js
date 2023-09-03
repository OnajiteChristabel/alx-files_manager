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

    // check connection status and report
  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  // get value for given key from redis server
  async get(key) {
    const redisGet = promisify(this.client.get).bind(this.client);
    const value = await redisGet(key);
    return value;
  }
    // set key value pair to redis server
  async set(key, value, time) {
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(key, value);
    await this.client.expire(key, time);
    }
