/**
 * Health Check Controller
 */

import { Request, Response } from 'express';
import DatabaseService from '../services/DatabaseService';
import RedisService from '../services/RedisService';
import sentimentQueue from '../jobs/queue';
import { HEALTH_STATUS } from '../constants/health';
import { HTTP_STATUS } from '../constants/httpStatus';

export class HealthController {
  /**
   * Health check endpoint
   * GET /health
   */
  static async check(_req: Request, res: Response): Promise<void> {
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

      res.status(isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: isHealthy ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
        timestamp: new Date().toISOString(),
        services: {
          database: mongoStatus,
          redis: redisStatus,
          bullmq: bullmqStatus,
        },
      });
    } catch (error) {
      // If health check itself fails, return unhealthy
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: HEALTH_STATUS.UNHEALTHY,
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  }
}
