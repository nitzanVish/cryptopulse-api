/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse by limiting requests per IP
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Global rate limiter for all API endpoints
 * Limits each IP to a certain number of requests per time window
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  handler: (req, res) => {
    const minutes = Math.ceil(config.rateLimit.windowMs / 60000);
    LoggerServiceInstance.warn(`Rate limit exceeded for IP: ${req.ip} - ${req.originalUrl}`);
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: `Too many requests from this IP, please try again after ${minutes} minutes`,
    });
  },
  // Skip rate limiting for health check endpoint
  skip: (req) => {
    return req.path === '/health';
  },
});
