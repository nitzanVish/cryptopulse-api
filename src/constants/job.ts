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

export const WORKER_CONFIG = {
  CONCURRENCY: 1,
  RATE_LIMIT: {
    MAX_JOBS: 4,
    DURATION_MS: 60000, // 1 minute
  },
} as const;
