/**
 * Validation error messages
 */

/** Allowed: letters, numbers, underscore, hyphen */
export const SENTIMENT_SYMBOL_REGEX = /^[a-zA-Z0-9_-]+$/;

export const VALIDATION_MESSAGES = {
  SENTIMENT: {
    SYMBOL_REQUIRED: 'Symbol is required',
    SYMBOL_MAX_LENGTH: 'Symbol must be 10 characters or less',
    SYMBOL_INVALID_FORMAT: 'Symbol must contain only letters, numbers, underscore, or hyphen',
    SYMBOLS_MIN_LENGTH: 'At least one symbol is required',
    SYMBOLS_MAX_LENGTH: 'Cannot analyze more than 50 symbols at once',
  },
} as const;
