/**
 * AI/Gemini-related constants
 */

export const AI_CONFIG = {
  // Gemini model configuration
  MODEL_NAME: 'gemini-2.5-flash-lite',
  
  // Default/fallback values
  DEFAULT_SENTIMENT_SCORE: 50,
  DEFAULT_SENTIMENT_LABEL: 'Neutral' as const,
  
  // Fallback messages
  NO_NEWS_MESSAGE: 'No news available.',
  ANALYSIS_FAILED_MESSAGE: 'AI Analysis failed due to technical error.',
  ANALYSIS_COMPLETED_MESSAGE: 'Analysis completed.',
  
  // Sentiment label options
  VALID_SENTIMENT_LABELS: ['Bullish', 'Bearish', 'Neutral'] as const,
  
  // Score boundaries
  MIN_SCORE: 0,
  MAX_SCORE: 100,
} as const;
