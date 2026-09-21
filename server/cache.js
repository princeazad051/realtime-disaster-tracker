/**
 * Simple in-memory cache with configurable TTL (default 5 minutes = 300,000 ms)
 */
class InMemoryCache {
  constructor(defaultTtlMs = 5 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  set(key, value, customTtlMs = null) {
    const ttl = customTtlMs ?? this.defaultTtlMs;
    const now = Date.now();
    const entry = {
      value,
      timestamp: now,
      expiresAt: now + ttl,
      ttlMs: ttl
    };
    this.store.set(key, entry);
    return entry;
  }

  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  getMetadata(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return {
        cached: false,
        cachedAt: null,
        expiresAt: null,
        ttlRemainingSeconds: 0,
        hits: this.hits,
        misses: this.misses
      };
    }

    const now = Date.now();
    const isExpired = now > entry.expiresAt;
    const remainingMs = Math.max(0, entry.expiresAt - now);

    return {
      cached: !isExpired,
      cachedAt: new Date(entry.timestamp).toISOString(),
      expiresAt: new Date(entry.expiresAt).toISOString(),
      ttlRemainingSeconds: Math.round(remainingMs / 1000),
      hits: this.hits,
      misses: this.misses
    };
  }
}

export const incidentCache = new InMemoryCache(5 * 60 * 1000); // 5-minute TTL
export default InMemoryCache;
