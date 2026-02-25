/**
 * Request Logger Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `📥 ${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`;

    // Log level based on status code:
    if (res.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      LoggerServiceInstance.error(logMessage);
    } else if (res.statusCode >= HTTP_STATUS.BAD_REQUEST) {
      LoggerServiceInstance.warn(logMessage);
    } else {
      LoggerServiceInstance.info(logMessage);
    }
  });

  next();
};
