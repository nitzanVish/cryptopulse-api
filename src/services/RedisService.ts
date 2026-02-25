/**
 * Redis connection for caching and BullMQ
 */

import Redis, { RedisOptions } from 'ioredis';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import { config } from '../config/index.js';
import { REDIS_CONFIG } from '../constants/redis.js';

class RedisService {
  private static client: Redis | null = null;
  private static isReady: boolean = false;

  private static createRedisConfig(): RedisOptions {
    return {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      commandTimeout: REDIS_CONFIG.COMMAND_TIMEOUT_MS,
      connectTimeout: REDIS_CONFIG.CONNECT_TIMEOUT_MS,
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy: (times: number) => {
        if (times > REDIS_CONFIG.RETRY_STRATEGY.MAX_RETRIES_BEFORE_SLOWDOWN) {
          LoggerServiceInstance.error('Redis: Too many retries, slowing down...');
          return REDIS_CONFIG.RETRY_STRATEGY.SLOWDOWN_DELAY_MS;
        }
        return Math.min(
          times * REDIS_CONFIG.RETRY_STRATEGY.BASE_DELAY_MS,
          REDIS_CONFIG.RETRY_STRATEGY.MAX_DELAY_MS
        );
      },
    };
  }

  /**
   * Initialize the client properly
   */
  static getClient(): Redis {
    if (!RedisService.client) {
      RedisService.client = new Redis(RedisService.createRedisConfig());
      RedisService.setupClientEvents(RedisService.client);
    }
    return RedisService.client;
  }

  private static setupClientEvents(client: Redis): void {
    client.on('connect', () => {
      LoggerServiceInstance.info('🔌 Redis connecting...');
    });

    client.on('ready', () => {
      RedisService.isReady = true;
      LoggerServiceInstance.info('✅ Redis connected and ready');
    });

    client.on('error', (error) => {
      // ioredis tries to reconnect automatically
      LoggerServiceInstance.error('❌ Redis error:', error);
    });

    client.on('close', () => {
      RedisService.isReady = false;
      LoggerServiceInstance.warn('Redis client connection closed');
    });

    client.on('reconnecting', () => {
      LoggerServiceInstance.warn('🔄 Redis reconnecting...');
    });

    // Log command timeouts for debugging
    client.on('commandTimeout', (command: string) => {
      LoggerServiceInstance.error(`⏱️ Redis command timeout: ${command}`);
    });
  }

  /**
   * Connect with timeout using Promise.race
   */
  static async connect(): Promise<void> {
    const client = RedisService.getClient();

    if (client.status === 'ready') {
      return;
    }

    const connectPromise = new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        client.removeListener('ready', onReady);
        client.removeListener('error', onError);
      };

      client.once('ready', onReady);
      client.once('error', onError);
    });

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Redis connection timeout (${REDIS_CONFIG.CONNECTION_TIMEOUT_MS}ms)`)),
        REDIS_CONFIG.CONNECTION_TIMEOUT_MS
      );
    });

    try {
      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      LoggerServiceInstance.error('Failed to establish initial Redis connection', error);
      throw error;
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    if (!RedisService.isReady) {
      LoggerServiceInstance.warn(`Skipping Redis GET for ${key} - Client not ready`);
      return null;
    }

    try {
      const data = await RedisService.getClient().get(key);
      if (!data) return null;
      
      try {
        return JSON.parse(data) as T;
      } catch (error) {
        LoggerServiceInstance.error(`Error parsing JSON from Redis key ${key}`, error);
        return null;
      }
    } catch (error) {
      LoggerServiceInstance.error(`Redis GET error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional expiration
   * @param key Cache key
   * @param value Data to store (will be JSON stringified)
   * @param ttlSeconds Time to live in seconds (optional)
   */
  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!RedisService.isReady) {
      LoggerServiceInstance.warn(`Skipping Redis SET for ${key} - Client not ready`);
      return;
    }

    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await RedisService.getClient().set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await RedisService.getClient().set(key, stringValue);
      }
    } catch (error) {
      LoggerServiceInstance.error(`Redis SET error for key: ${key}`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  static async del(key: string): Promise<void> {
    if (!RedisService.isReady) {
      LoggerServiceInstance.warn(`Skipping Redis DEL for ${key} - Client not ready`);
      return;
    }

    try {
      await RedisService.getClient().del(key);
    } catch (error) {
      LoggerServiceInstance.error(`Redis DEL error for key: ${key}`, error);
    }
  }

  /**
   * Close connection (Graceful Shutdown)
   */
  static async disconnect(): Promise<void> {
    if (RedisService.client) {
      await RedisService.client.quit();
      RedisService.client = null;
      RedisService.isReady = false;
      LoggerServiceInstance.info('Redis connection closed');
    }
  }

  /**
   * Ping Redis to check connection
   */
  static async ping(): Promise<boolean> {
    if (!RedisService.isReady) {
      return false;
    }

    try {
      const result = await RedisService.getClient().ping();
      return result === 'PONG';
    } catch (error) {
      LoggerServiceInstance.error('Redis ping failed:', error);
      return false;
    }
  }
}

export default RedisService;
