/**
 * MongoDB Error Handler
 * Normalizes MongoDB-specific errors to AppError format
 */

import { AppError } from './errors.js';
import { MESSAGES } from '../constants/messages.js';

const handleCastErrorDB = (err: any): AppError => {
  const message = MESSAGES.ERRORS.MONGO.INVALID_FIELD(err.path, err.value);
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] || err.keyValue 
    ? Object.values(err.keyValue)[0] 
    : 'value';
  const message = MESSAGES.ERRORS.MONGO.DUPLICATE_FIELD(String(value));
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors || {}).map((el: any) => el.message);
  const message = MESSAGES.ERRORS.MONGO.VALIDATION_ERROR(errors);
  return new AppError(message, 400);
};

/**
 * Checks if the error is a MongoDB specific error and transforms it into an AppError
 * @param err - The error to check
 * @returns AppError if it's a MongoDB error, null otherwise
 */
export const normalizeMongoError = (err: any): AppError | null => {
  if (err.name === 'CastError') return handleCastErrorDB(err);
  if (err.code === 11000) return handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') return handleValidationErrorDB(err);

  return null; // Return null if it's not a Mongo error
};
