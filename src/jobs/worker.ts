/**
 * BullMQ Worker - Consumer side (processes jobs)
 */

import { Worker, Job } from 'bullmq';
import RedisService from '../services/RedisService.js';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import sentimentService from '../services/SentimentService.js';
import type { JobData } from '../types/job.js';
import { QUEUE_NAMES, WORKER_CONFIG } from '../constants/job.js';

class SentimentWorker {
  private worker: Worker<JobData> | null = null;

  /**
   * Initialize and start the worker
   */
  start(): void {
    if (this.worker) {
      LoggerServiceInstance.warn('Worker already started');
      return;
    }

    this.worker = new Worker<JobData>(
      QUEUE_NAMES.SENTIMENT_ANALYSIS,
      async (job: Job<JobData>) => {
        return await this.processJob(job);
      },
      {
        connection: RedisService.getClient(),
        concurrency: WORKER_CONFIG.CONCURRENCY, // Process one job at a time (to respect rate limits)
        limiter: {
          max: WORKER_CONFIG.RATE_LIMIT.MAX_JOBS,
          duration: WORKER_CONFIG.RATE_LIMIT.DURATION_MS,
        },
      }
    );

    this.worker.on('completed', (job: Job<JobData>) => {
      LoggerServiceInstance.info(`Job completed: ${job.data.symbol}`);
    });

    this.worker.on('failed', (job: Job<JobData> | undefined, error: Error) => {
      LoggerServiceInstance.error(`Job failed: ${job?.data.symbol || 'unknown'}`, error);
    });

    this.worker.on('error', (error: Error) => {
      LoggerServiceInstance.error('Worker error:', error);
    });

    LoggerServiceInstance.info('✅ Sentiment analysis worker started');
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job<JobData>): Promise<void> {
    const { symbol } = job.data;

    LoggerServiceInstance.info(`Processing sentiment analysis job for ${symbol}`);

    try {
      await sentimentService.analyzeSymbol(symbol);
      LoggerServiceInstance.info(`Successfully processed sentiment analysis for ${symbol}`);
    } catch (error) {
      LoggerServiceInstance.error(`Error processing job for ${symbol}:`, error);
      
      // Re-throw to trigger BullMQ retry mechanism
      throw error;
    }
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      LoggerServiceInstance.info('Sentiment analysis worker stopped');
    }
  }

  /**
   * Get worker instance (for monitoring)
   */
  getWorker(): Worker<JobData> | null {
    return this.worker;
  }
}

export default new SentimentWorker();
