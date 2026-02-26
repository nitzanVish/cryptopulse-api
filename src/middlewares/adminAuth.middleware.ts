/**
 * Admin API authentication - requires ADMIN_SENTIMENT_STATUS_TOKEN when set
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { MESSAGES } from '../constants/messages.js';

const SENTIMENT_STATUS_TOKEN = config.admin.sentimentStatusToken;

/**
 * Require admin token for sentiment status endpoint.
 * Token can be sent via: Authorization: Bearer <token> or X-Admin-Token: <token>
 * When ADMIN_SENTIMENT_STATUS_TOKEN is not set: in development the route is open; in production returns 503.
 */
export const authenticateAdminApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!SENTIMENT_STATUS_TOKEN) {
    if (config.isDevelopment) {
      next();
      return;
    }
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'error',
      message: MESSAGES.ADMIN.SENTIMENT_STATUS_NOT_CONFIGURED,
    });
    return;
  }

  const authHeader = req.headers.authorization;
  const headerToken = req.headers['x-admin-token'];
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;
    console.log('bearerToken', bearerToken);
    console.log('headerToken', headerToken);
  const supplied = bearerToken ?? headerToken;

  if (supplied !== SENTIMENT_STATUS_TOKEN) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'error',
      message: MESSAGES.ADMIN.INVALID_OR_MISSING_TOKEN,
    });
    return;
  }

  next();
};
