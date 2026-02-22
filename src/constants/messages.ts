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
  SENTIMENT: {
    INSUFFICIENT_DATA: 'Insufficient news data available for analysis.',
  },
} as const;
