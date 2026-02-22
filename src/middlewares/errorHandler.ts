/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { LoggerServiceInstance } from '../utils/LoggerService';
import { config } from '../config';
import { MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { normalizeMongoError } from '../utils/mongoErrorHandler';
import { AppError } from '../utils/errors';

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Normalize MongoDB errors (converts them to AppError with isOperational=true)
  let error = normalizeMongoError(err);

  // 2. Identify if this is a known error or an unexpected bug
  if (!error) {
    if (err instanceof AppError) {
      // This is an error we created explicitly (Operational)
      error = err;
    } else {
      // Programmer Error - mark this as non-operational
      error = new AppError(
        config.isDevelopment ? err.message : MESSAGES.ERRORS.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        false
      );
      // Preserve original stack trace for logging
      error.stack = err.stack;
    }
  }

  const statusCode = error.statusCode;
  const message = error.message;

  // --- Logging Strategy ---

  if (!error.isOperational) {
    // Case 1: Bug in code (e.g., undefined.something)
    // This requires urgent developer attention
    LoggerServiceInstance.error('CRITICAL: Unexpected Bug detected:', {
      originalError: err,
      stack: err.stack,
    });
  } else if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    // Case 2: Server down / DB not responding (Operational but Critical)
    LoggerServiceInstance.error('Operational Server Error:', {
      message: error.message,
      statusCode,
    });
  } else {
    // Case 3: Client errors (400-499)- WARN for tracking user errors
    LoggerServiceInstance.warn(`⚠️ Client Error: ${message}`, { statusCode });
  }

  // --- Send response to client ---
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail', // error for server, fail for client
    message: message,
    stack: config.isDevelopment ? error.stack : undefined,
  });
};
