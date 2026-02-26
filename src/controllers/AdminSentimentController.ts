/**
 * Admin API - Sentiment queue status (protected by ADMIN_SENTIMENT_STATUS_TOKEN)
 */

import { Request, Response, NextFunction } from 'express';
import { getJobsForAdmin, ADMIN_STATUS_LIMITS } from '../jobs/adminQueueService.js';
import sentimentQueue from '../jobs/queue.js';
import type { AdminStatusResponse } from '../types/api.js';

export class AdminSentimentController {
  /**
   * GET /api/v1/admin/sentiment/status
   * Returns list of jobs (completed, failed, active) with symbol, cycleId, status, finishedAt, failedReason.
   */
  static getStatus = async (_req: Request, res: Response<AdminStatusResponse>, next: NextFunction): Promise<void> => {
    try {
      const limitParam = Number(_req.query.limit);
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : ADMIN_STATUS_LIMITS.DEFAULT;
      const jobs = await getJobsForAdmin(limit);
      const stats = await sentimentQueue.getStats();
      const response: AdminStatusResponse = {
        stats: { waiting: stats.waiting, active: stats.active, completed: stats.completed, failed: stats.failed },
        jobs,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
