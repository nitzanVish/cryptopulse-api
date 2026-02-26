/**
 * Scheduler - Dispatches jobs periodically
 * Uses Redis Distributed Lock to prevent duplicate executions across multiple instances
 */
import cron from 'node-cron';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import { config } from '../config/index.js';
import RedisService from '../services/RedisService.js';
import sentimentQueue from './queue.js';
import coinConfigService from '../services/CoinConfigService.js';
import { SCHEDULER_LOCK } from '../constants/redis.js';

class SentimentScheduler {
  private task: cron.ScheduledTask | null = null;

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.task) {
      LoggerServiceInstance.warn('Scheduler already started');
      return;
    }

    LoggerServiceInstance.info(`📅 Initializing Scheduler with interval: ${config.jobs.sentimentAnalysisInterval}`);

    // Schedule the cron job
    this.task = cron.schedule(
      config.jobs.sentimentAnalysisInterval,
      async () => {
        await this.handleCronTick();
      },
      {
        scheduled: true,
        timezone: 'UTC',
      }
    );

    LoggerServiceInstance.info('✅ Sentiment scheduler started');

    if (config.isProduction) {
      this.handleCronTick(true).catch((error) => {
        LoggerServiceInstance.error('Error in initial scheduler run:', error);
      });
    } else {
      LoggerServiceInstance.debug('⏸️ Skipping initial run in development mode');
    }
  }

  /**
   * Core logic that runs on every cron tick
   * Uses Redis Distributed Lock to prevent duplicate executions across multiple instances
   * Lock expires automatically via TTL (not released manually) to handle clock skew
   */
  private async handleCronTick(isInitialRun = false): Promise<void> {
    try {
      const cycleId = this.getCurrentCycleId();

      LoggerServiceInstance.debug(`Attempting to acquire scheduler lock with key: ${SCHEDULER_LOCK.KEY}`);
      const acquired = await RedisService.getClient().set(
        SCHEDULER_LOCK.KEY,
        `LOCKED_BY_${process.env.HOSTNAME || process.pid || 'UNKNOWN'}`,
        'EX',
        SCHEDULER_LOCK.TTL_SECONDS,
        'NX'
      );
      LoggerServiceInstance.debug(`Lock acquisition result: ${acquired}`);

      if (acquired !== 'OK') {
        const context = isInitialRun ? 'Initial run' : 'Cron tick';
        LoggerServiceInstance.debug(`🔒 ${context}: Scheduler lock exists. Another instance is handling this. Skipping.`);
        return;
      }

      LoggerServiceInstance.info(`🔐 Scheduler lock acquired (${isInitialRun ? 'Startup' : 'Cron'}). Dispatching jobs for cycle ${cycleId}...`);
      await this.dispatchJobs(cycleId);
      // Lock expires automatically via TTL to prevent late servers from running duplicates

    } catch (error) {
      LoggerServiceInstance.error('❌ Error in cron execution flow:', error);
    }
  }

  private getCurrentCycleId(): string {
    // Round down to the start of the current hour (UTC) to get a simple, deterministic cycleId.
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString(); // e.g. 2026-02-26T12:00:00.000Z
  }

  private async dispatchJobs(cycleId: string): Promise<void> {
    try {
      const enabledCoins = await coinConfigService.getEnabledCoins();

      if (enabledCoins.length === 0) {
        LoggerServiceInstance.warn('⚠️ No enabled coins found in DB to analyze.');
        return;
      }

      LoggerServiceInstance.info(`Found ${enabledCoins.length} active coins to analyze for cycle ${cycleId}.`);

      const symbols = enabledCoins.map((coin) => coin.symbol);
      await sentimentQueue.addJobs(symbols, cycleId);

      LoggerServiceInstance.info(`🚀 Successfully dispatched jobs for cycle ${cycleId}: ${symbols.join(', ')}`);

    } catch (error) {
      LoggerServiceInstance.error('❌ Failed to dispatch jobs:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler gracefully
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      LoggerServiceInstance.info('🛑 Sentiment scheduler stopped');
    }
  }
}

export default new SentimentScheduler();
