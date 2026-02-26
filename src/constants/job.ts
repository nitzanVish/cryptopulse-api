/**
 * Job/Queue-related constants
 */

export const JOB_NAMES = {
  /**
   * Sentiment analysis job name
   */
  ANALYZE_SENTIMENT: 'analyze-sentiment',
} as const;

export const QUEUE_NAMES = {
  /**
   * Sentiment analysis queue name
   */
  SENTIMENT_ANALYSIS: 'sentiment-analysis',
} as const;

/**
 * Completed jobs retention: development removes quickly; production keeps limited history for debugging.
 */
export const REMOVE_ON_COMPLETE = {
  development: { count: 0, age: 1 }, // Remove after 1 second
  production: { count: 20, age: 7200 }, // Keep up to 20 jobs or 2 hours
} as const;

/**
 * Failed jobs retention (same for all envs).
 */
export const REMOVE_ON_FAIL = {
  age: 24 * 3600, // Keep failed jobs for 24 hours (debugging)
} as const;

/**
 * Default job retry/backoff behavior (delay/attempts come from config/env).
 */
export const BACKOFF_TYPE = 'exponential' as const;

/**
 * Admin queue monitoring defaults
 */
export const ADMIN_JOB_STATUSES = ['completed', 'failed', 'active'] as const;
export type AdminJobStatus = (typeof ADMIN_JOB_STATUSES)[number];

export const ADMIN_STATUS_DEFAULT_LIMIT = 100;
export const ADMIN_STATUS_MAX_LIMIT = 500;

export const WORKER_CONFIG = {
  CONCURRENCY: 1,
  RATE_LIMIT: {
    MAX_JOBS: 4,
    DURATION_MS: 60000, // 1 minute
  },
} as const;
