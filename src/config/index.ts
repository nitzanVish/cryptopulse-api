/**
 * Configuration - Exports validated config object
 * Uses Zod for type-safe validation
 */

import env from './env.js';

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  mongo: {
    uri: env.MONGODB_URI,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },
  news: {
    newsApiKey: env.NEWS_API_KEY,
    newsApiBaseUrl: env.NEWS_API_BASE_URL || 'https://newsapi.org/v2',
    cryptoCompareApiKey: env.CRYPTOCOMPARE_API_KEY,
    cryptoCompareBaseUrl: env.CRYPTOCOMPARE_BASE_URL || 'https://min-api.cryptocompare.com',
  },
  jobs: {
    sentimentAnalysisInterval: env.SENTIMENT_ANALYSIS_INTERVAL,
    rateLimitMaxJobs: env.RATE_LIMIT_MAX_JOBS,
    retryAttempts: env.JOB_RETRY_ATTEMPTS,
    backoffDelay: env.JOB_BACKOFF_DELAY,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    origin: env.FRONTEND_URL || 'http://localhost:5173',
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  admin: {
    sentimentStatusToken: env.ADMIN_SENTIMENT_STATUS_TOKEN,
  },
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
};
