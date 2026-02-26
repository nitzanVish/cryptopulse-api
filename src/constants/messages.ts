/**
 * Application-wide message constants
 */

export const MESSAGES = {
  API: {
    NAME: 'CryptoPulse API - Market Sentiment Analysis',
    VERSION: '1.0.0',
  },
  ERRORS: {
    ROUTE_NOT_FOUND: (route: string) => `Route ${route} not found`,
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
    STATUS: 'error',
    MONGO: {
      INVALID_FIELD: (path: string, value: any) => `Invalid ${path}: ${value}.`,
      DUPLICATE_FIELD: (value: string) => `Duplicate field value: ${value}. Please use another value!`,
      VALIDATION_ERROR: (errors: string[]) => `Invalid input data. ${errors.join('. ')}`,
    },
  },
  HEALTH: {
    CHECK_FAILED: 'Health check failed',
  },
  SENTIMENT: {
    INSUFFICIENT_DATA: 'Insufficient news data available for analysis.',
  },
  ADMIN: {
    SENTIMENT_STATUS_NOT_CONFIGURED: 'Admin sentiment status is not configured (ADMIN_SENTIMENT_STATUS_TOKEN not set)',
    INVALID_OR_MISSING_TOKEN: 'Invalid or missing admin token',
  },
} as const;
