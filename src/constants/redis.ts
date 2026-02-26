/**
 * Redis constants
 */

export const REDIS_PONG_RESPONSE = 'PONG';

/**
 * Redis connection configuration constants
 */
export const REDIS_CONFIG = {
  // Command timeout: maximum time to wait for a Redis command to complete
  // Increased to 15 seconds for cloud Redis (Redis Labs) which may be slower
  COMMAND_TIMEOUT_MS: 15000,
  
  // Connection timeout: maximum time to wait for initial connection (10 seconds)
  CONNECT_TIMEOUT_MS: 10000,
  
  // Retry strategy configuration
  RETRY_STRATEGY: {
    // Maximum retry attempts before slowing down
    // At max delay (3s per retry), 50 retries = ~2.5 minutes total
    MAX_RETRIES_BEFORE_SLOWDOWN: 50,
    // Delay when exceeding max retries (5 seconds)
    SLOWDOWN_DELAY_MS: 5000,
    // Base delay multiplier for exponential backoff (100ms)
    BASE_DELAY_MS: 100,
    // Maximum delay between retries (3 seconds)
    MAX_DELAY_MS: 3000,
  },
  
  // Connection timeout for Promise.race in connect() (10 seconds)
  CONNECTION_TIMEOUT_MS: 10000,
} as const;

/**
 * Redis distributed lock constants for scheduler
 * Used to prevent duplicate job executions across multiple server instances
 */
export const SCHEDULER_LOCK = {
  KEY: 'scheduler:lock:sentiment_dispatch',
  TTL_SECONDS: 60 * 60, // 60 minutes - covers one full analysis cycle window
} as const;
