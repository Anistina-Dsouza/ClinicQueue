const { createClient } = require('redis');

// Custom in-memory Sorted Set (ZSET) emulator for zero-config local development
class MockRedisClient {
  constructor() {
    this.store = new Map(); // key -> Array of { score, value }
    this.isOpen = false;
  }

  async connect() {
    this.isOpen = true;
    console.log('⚠️  [Redis Emulation] Local Redis server not found. Swapped in active In-Memory Cache Store.');
  }

  async quit() {
    this.isOpen = false;
    console.log('[Redis Emulation] In-Memory Cache Store shut down.');
  }

  async zAdd(key, entry) {
    if (!this.store.has(key)) {
      this.store.set(key, []);
    }
    const list = this.store.get(key);
    
    // Remove old item if it exists
    const filtered = list.filter(item => item.value !== entry.value);
    filtered.push({ score: entry.score, value: entry.value });
    
    this.store.set(key, filtered);
    return 1;
  }

  async zRangeWithScores(key, start, end, options = {}) {
    const list = this.store.get(key) || [];
    
    // Clone and sort based on score
    let sorted = [...list];
    if (options.REV) {
      sorted.sort((a, b) => b.score - a.score);
    } else {
      sorted.sort((a, b) => a.score - b.score);
    }
    
    return sorted;
  }

  async zRem(key, value) {
    const list = this.store.get(key) || [];
    const initialLen = list.length;
    const filtered = list.filter(item => item.value !== value.toString());
    
    this.store.set(key, filtered);
    return initialLen - filtered.length;
  }

  async del(key) {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }
}

const mockClient = new MockRedisClient();
let activeClient = null;
let useMock = false;

// Create real client with fail-fast reconnect strategy
const realClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Do not retry indefinitely on initial failure
      return false;
    }
  }
});

realClient.on('error', (err) => {
  if (!useMock) {
    console.warn(`\n[Redis Warning] Connection failed: ${err.message}. Switching to in-memory emulation.\n`);
    useMock = true;
    activeClient = mockClient;
    mockClient.connect();
  }
});

const connectRedis = async () => {
  try {
    activeClient = realClient;
    // Attempt fast connect
    await realClient.connect();
    console.log('Redis Client Connected and Ready!');
  } catch (error) {
    if (!useMock) {
      console.warn(`\n[Redis Warning] Local Redis connection failed: ${error.message}. Switching to in-memory emulation.\n`);
      useMock = true;
      activeClient = mockClient;
      await mockClient.connect();
    }
  }
};

// Delegator proxy to dynamically route calls to the active client
const redisClient = {
  get isOpen() {
    return activeClient ? activeClient.isOpen : false;
  },
  zAdd: async (...args) => activeClient.zAdd(...args),
  zRangeWithScores: async (...args) => activeClient.zRangeWithScores(...args),
  zRem: async (...args) => activeClient.zRem(...args),
  del: async (...args) => activeClient.del(...args),
  quit: async () => {
    if (activeClient) await activeClient.quit();
  }
};

module.exports = { redisClient, connectRedis };
