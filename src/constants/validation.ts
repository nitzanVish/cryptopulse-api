/**
 * Validation error messages
 */

export const VALIDATION_MESSAGES = {
  SENTIMENT: {
    SYMBOL_REQUIRED: 'Symbol is required',
    SYMBOL_MAX_LENGTH: 'Symbol must be 10 characters or less',
    SYMBOL_INVALID_FORMAT: 'Symbol must contain only letters and numbers',
  },
} as const;
