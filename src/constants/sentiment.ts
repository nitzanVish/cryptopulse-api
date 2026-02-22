/**
 * Sentiment-related constants
 */

export const SENTIMENT_CONFIG = {
  // Cache TTL in seconds (1 hour)
  CACHE_TTL: 3600,
  
  // Neutral sentiment score when no data available
  NEUTRAL_SCORE: 50,
} as const;
