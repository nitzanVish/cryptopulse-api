/**
 * Environment variables configuration and validation
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3001'),
  
  // MongoDB
  MONGODB_URI: z.string().url(),
  
  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  REDIS_PASSWORD: z.string().min(1),
  
  // Gemini API
  GEMINI_API_KEY: z.string().min(1),
  
  // News API (at least one should be provided)
  NEWS_API_KEY: z.string().optional(),
  NEWS_API_BASE_URL: z.string().url().optional(),
  CRYPTOCOMPARE_API_KEY: z.string().optional(),
  CRYPTOCOMPARE_BASE_URL: z.string().url().optional(),
  
  // Frontend URL for CORS
  FRONTEND_URL: z.string().url().optional(),
  
  // Job Configuration
  SENTIMENT_ANALYSIS_INTERVAL: z.string().default('0 */2 * * *'), // Every 2 hours
  RATE_LIMIT_MAX_JOBS: z.string().transform(Number).pipe(z.number().int().positive()).default('4'),
  JOB_RETRY_ATTEMPTS: z.string().transform(Number).pipe(z.number().int().nonnegative()).default('3'),
  JOB_BACKOFF_DELAY: z.string().transform(Number).pipe(z.number().int().nonnegative()).default('5000'),
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

try {
  env = envSchema.parse(process.env);
  
  // Validate that at least one news API is configured
  if (!env.NEWS_API_KEY && !env.CRYPTOCOMPARE_API_KEY) {
    throw new Error('At least one news API key must be provided (NEWS_API_KEY or CRYPTOCOMPARE_API_KEY)');
  }
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export default env;
