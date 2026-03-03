/**
 * Sentiment-related constants
 */

export const SENTIMENT_CONFIG = {
  // Cache TTL in seconds (1 hour)
  CACHE_TTL: 3600,

  // Neutral sentiment score when no data available
  NEUTRAL_SCORE: 50,

  // Priority for coins added via on-demand analysis (higher = analyzed first)
  ON_DEMAND_PRIORITY: 100,

  // Window in ms for "recent" sentiment check — symbols with analysis within this window are skipped (2 hours)
  RECENT_ANALYSIS_WINDOW_MS: 2 * 60 * 60 * 1000,
} as const;
