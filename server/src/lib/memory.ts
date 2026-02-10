import Redis from 'ioredis';

export type Msg = { role: 'user' | 'assistant' | 'system'; text: string; ts: number };

// In-memory fallback when Redis is not available (safe for dev/testing)
const inMemoryStore = new Map<string, Msg[]>();

let redis: Redis | null = null;
let redisAvailable = false;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('connect', () => {
      redisAvailable = true;
      console.log('[ioredis] connected');
    });
    redis.on('ready', () => {
      redisAvailable = true;
    });
    redis.on('error', (err: any) => {
      redisAvailable = false;
      console.error('[ioredis] error', err?.message ?? err);
    });
    redis.on('end', () => {
      redisAvailable = false;
      console.warn('[ioredis] connection ended');
    });
  } catch (err) {
    redis = null;
    redisAvailable = false;
    console.warn('[ioredis] init failed, using in-memory store');
  }
} else {
  console.log('[ioredis] REDIS_URL not set — using in-memory store');
}

export async function pushShortTerm(sessionId: string, msg: Msg) {
  const key = `session:${sessionId}:msgs`;
  if (!redisAvailable || !redis) {
    const arr = inMemoryStore.get(key) || [];
    arr.push(msg);
    // keep last 30
    inMemoryStore.set(key, arr.slice(-30));
    return;
  }

  try {
    await redis.rpush(key, JSON.stringify(msg));
    await redis.ltrim(key, -30, -1);
    await redis.expire(key, 60 * 60 * 24 * 7);
  } catch (err) {
    console.error('[ioredis] pushShortTerm failed, falling back to memory', err?.message ?? err);
    const arr = inMemoryStore.get(key) || [];
    arr.push(msg);
    inMemoryStore.set(key, arr.slice(-30));
  }
}

export async function getShortTerm(sessionId: string, limit = 20): Promise<Msg[]> {
  const key = `session:${sessionId}:msgs`;
  if (!redisAvailable || !redis) {
    const arr = inMemoryStore.get(key) || [];
    return arr.slice(-limit);
  }

  try {
    const items = await redis.lrange(key, -limit, -1);
    return items.map(i => JSON.parse(i) as Msg);
  } catch (err) {
    console.error('[ioredis] getShortTerm failed, falling back to memory', err?.message ?? err);
    const arr = inMemoryStore.get(key) || [];
    return arr.slice(-limit);
  }
}

export async function clearShortTerm(sessionId: string) {
  const key = `session:${sessionId}:msgs`;
  inMemoryStore.delete(key);
  if (!redisAvailable || !redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[ioredis] clearShortTerm failed', err?.message ?? err);
  }
}

export function isRedisAvailable() {
  return redisAvailable;
}
