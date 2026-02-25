/**
 * Sentiment DTOs and validation schemas
 */

import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/validation.js';

/**
 * Schema for get sentiment endpoint
 * Validates params (symbol)
 */
export const getSentimentSchema = z.object({
  params: z.object({
    symbol: z
      .string()
      .min(1, VALIDATION_MESSAGES.SENTIMENT.SYMBOL_REQUIRED)
      .max(10, VALIDATION_MESSAGES.SENTIMENT.SYMBOL_MAX_LENGTH)
      .regex(/^[a-zA-Z0-9]+$/, VALIDATION_MESSAGES.SENTIMENT.SYMBOL_INVALID_FORMAT)
      .transform((val) => val.toUpperCase()),
  }),
});

export type GetSentimentDto = z.infer<typeof getSentimentSchema>;
