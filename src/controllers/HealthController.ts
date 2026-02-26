/**
 * Health Check Controller
 */

import { Request, Response } from 'express';
import DatabaseService from '../services/DatabaseService.js';
import RedisService from '../services/RedisService.js';
import sentimentQueue from '../jobs/queue.js';
import { HEALTH_STATUS } from '../constants/health.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { MESSAGES } from '../constants/messages.js';
import type { HealthResponse } from '../types/api.js';

export class HealthController {
  /**
   * Health check endpoint
   * GET /health
   */
  static async check(_req: Request, res: Response<HealthResponse>): Promise<void> {
    try {
      // Check MongoDB connection
      const mongoStatus = DatabaseService.getConnectionStatus() 
        ? HEALTH_STATUS.UP 
        : HEALTH_STATUS.DOWN;

      // Check Redis connection
      const redisStatus = await RedisService.ping() 
        ? HEALTH_STATUS.UP 
        : HEALTH_STATUS.DOWN;

      // Check BullMQ queue health
      let bullmqStatus: typeof HEALTH_STATUS.UP | typeof HEALTH_STATUS.DOWN = HEALTH_STATUS.DOWN;
      try {
        await sentimentQueue.getStats();
        // Queue is healthy if we can get stats (even if counts are 0)
        bullmqStatus = HEALTH_STATUS.UP;
      } catch (error) {
        // Queue is down if we can't get stats
        bullmqStatus = HEALTH_STATUS.DOWN;
      }

      // Determine overall health
      const isHealthy = mongoStatus === HEALTH_STATUS.UP 
        && redisStatus === HEALTH_STATUS.UP 
        && bullmqStatus === HEALTH_STATUS.UP;

      const response: HealthResponse = {
        status: isHealthy ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
        timestamp: new Date().toISOString(),
        services: { database: mongoStatus, redis: redisStatus, bullmq: bullmqStatus },
      };
      res.status(isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json(response);
    } catch (error) {
      const response: HealthResponse = {
        status: HEALTH_STATUS.UNHEALTHY,
        timestamp: new Date().toISOString(),
        services: { database: HEALTH_STATUS.DOWN, redis: HEALTH_STATUS.DOWN, bullmq: HEALTH_STATUS.DOWN },
        error: MESSAGES.HEALTH.CHECK_FAILED,
      };
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(response);
    }
  }
}
