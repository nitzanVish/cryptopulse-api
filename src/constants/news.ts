/**
 * News-related constants
 */

export const NEWS_CONFIG = {
  // News filtering - only analyze articles from last 24 hours
  TIME_WINDOW_HOURS: 24,
  
  // Maximum number of headlines to analyze
  MAX_HEADLINES: 10,
} as const;

export const NEWS_API_CONFIG = {
  // Fallback time window for NewsAPI (48h to catch yesterday's news due to 24h delay)
  FALLBACK_TIME_WINDOW_HOURS: 48,
  
  // Source prefix to mark NewsAPI as fallback source
  SOURCE_PREFIX: 'NewsAPI',
  
  // Default source name when source is unknown
  UNKNOWN_SOURCE: 'Unknown',
} as const;

export const CRYPTOCOMPARE_CONFIG = {
  // Source prefix to mark CryptoCompare as primary source
  SOURCE_PREFIX: 'CryptoCompare',
  
  // Default source name when source is unknown
  DEFAULT_SOURCE: 'Unknown',
} as const;
