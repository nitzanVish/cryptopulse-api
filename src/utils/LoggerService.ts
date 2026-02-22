/**
 * Logger Service - Winston logger as a class
 */

import winston from 'winston';
import path from 'path';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Human-readable format for development
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  // If there's an error (Stack Trace), display it instead of the regular message
  const logMessage = stack || message;
  return `${timestamp} [${level}]: ${logMessage} ${metaStr}`;
});

class LoggerService {
  private logger: winston.Logger;

  constructor() {
    // 1. Format based on environment
    const format = config.isProduction
      ? combine(timestamp(), errors({ stack: true }), json()) // Production: flat JSON
      : combine(
          errors({ stack: true }),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          colorize(), // Colors only in development
          devFormat
        );

    // 2. Configure transports
    const transports: winston.transport[] = [new winston.transports.Console()];

    // Add file transports only in development
    if (!config.isProduction) {
      transports.push(
        new winston.transports.File({
          filename: path.join('logs', 'error.log'),
          level: 'error',
          format: combine(timestamp(), json()),
        }),
        new winston.transports.File({
          filename: path.join('logs', 'combined.log'),
          format: combine(timestamp(), json()),
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.logging?.level || 'info',
      format: format,
      transports: transports,
    });
  }

  // Wrapper functions to maintain type safety
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}

export const LoggerServiceInstance = new LoggerService();
