/**
 * Custom Error Classes
 */

import { HTTP_STATUS } from '../constants/httpStatus';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Set error name to class name (e.g., "NotFoundError" instead of "Error")
    // This helps identify error types in logs and stack traces
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}
