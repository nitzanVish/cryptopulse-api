/**
 * Sentiment DTOs and validation schemas
 */

import { z } from 'zod';
import { VALIDATION_MESSAGES, SENTIMENT_SYMBOL_REGEX } from '../constants/validation.js';

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
      .regex(SENTIMENT_SYMBOL_REGEX, VALIDATION_MESSAGES.SENTIMENT.SYMBOL_INVALID_FORMAT)
      .transform((val) => val.toUpperCase()),
  }),
});

export type GetSentimentDto = z.infer<typeof getSentimentSchema>;

/**
 * Schema for on-demand analyze endpoint
 * Validates body (symbols array)
 */
export const analyzeSymbolsSchema = z.object({
  body: z.object({
    symbols: z.array(
      z.string()
        .min(1, VALIDATION_MESSAGES.SENTIMENT.SYMBOL_REQUIRED)
        .max(10, VALIDATION_MESSAGES.SENTIMENT.SYMBOL_MAX_LENGTH)
        .regex(SENTIMENT_SYMBOL_REGEX, VALIDATION_MESSAGES.SENTIMENT.SYMBOL_INVALID_FORMAT)
        .transform((val) => val.toUpperCase())
    )
      .min(1, VALIDATION_MESSAGES.SENTIMENT.SYMBOLS_MIN_LENGTH)
      .max(50, VALIDATION_MESSAGES.SENTIMENT.SYMBOLS_MAX_LENGTH),
  }),
});

export type AnalyzeSymbolsDto = z.infer<typeof analyzeSymbolsSchema>;
