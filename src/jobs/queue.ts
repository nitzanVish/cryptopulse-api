/**
 * BullMQ Queue Setup - Producer side
 */

import { Queue } from 'bullmq';
import RedisService from '../services/RedisService.js';
import { config } from '../config/index.js';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import type { JobData } from '../types/job.js';
import { JOB_NAMES, QUEUE_NAMES } from '../constants/job.js';

class SentimentQueue {
  private queue: Queue<JobData>;

  constructor() {
    this.queue = new Queue<JobData>(QUEUE_NAMES.SENTIMENT_ANALYSIS, {
      connection: RedisService.getClient(),
      defaultJobOptions: {
        attempts: config.jobs.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: config.jobs.backoffDelay,
        },
        removeOnComplete: config.isDevelopment
          ? { count: 0, age: 1 } // Development: Remove immediately (after 1 second)
          : { count: 100, age: 3600 }, // Production: Keep for 1 hour (important for debugging and multi-instance safety)
        removeOnFail: {
          age: 24 * 3600, // Keep failed jobs for 24 hours (important for debugging)
        },
      },
    });

    LoggerServiceInstance.info('✅ Sentiment analysis queue initialized');
  }

  /**
   * Add a sentiment analysis job for a symbol
   * Uses symbol-based jobId to prevent duplicates (if job with same symbol exists, it will be replaced)
   */
  async addJob(symbol: string): Promise<void> {
    try {
      const symbolUpper = symbol.toUpperCase();
      await this.queue.add(JOB_NAMES.ANALYZE_SENTIMENT, { symbol: symbolUpper }, {
        jobId: `${JOB_NAMES.ANALYZE_SENTIMENT}-${symbolUpper}`, // Unique jobId per symbol prevents duplicates
      });
      LoggerServiceInstance.debug(`Added sentiment analysis job for ${symbol}`);
    } catch (error) {
      LoggerServiceInstance.error(`Error adding job for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Add multiple jobs for multiple symbols
   * Uses symbol-based jobId to prevent duplicates (if job with same symbol exists, it will be replaced)
   */
  async addJobs(symbols: string[]): Promise<void> {
    if (symbols.length === 0) {
      LoggerServiceInstance.debug('No symbols provided, skipping job creation');
      return;
    }

    try {
      const jobs = symbols.map((symbol) => {
        const symbolUpper = symbol.toUpperCase();
        return {
          name: JOB_NAMES.ANALYZE_SENTIMENT,
          data: { symbol: symbolUpper },
          opts: {
            jobId: `${JOB_NAMES.ANALYZE_SENTIMENT}-${symbolUpper}`, // Unique jobId per symbol prevents duplicates
          },
        };
      });

      await this.queue.addBulk(jobs);
      LoggerServiceInstance.info(`Added ${symbols.length} sentiment analysis jobs`);
    } catch (error) {
      LoggerServiceInstance.error('Error adding bulk jobs:', error);
      throw error;
    }
  }

  /**
   * Get queue instance (for monitoring)
   */
  getQueue(): Queue<JobData> {
    return this.queue;
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}

export default new SentimentQueue();
