/**
 * MongoDB connection using Mongoose
 */

import mongoose, { ConnectOptions } from 'mongoose';
import { LoggerServiceInstance } from '../utils/LoggerService';
import { config } from '../config';
import { DATABASE_CONFIG } from '../constants/database';

class DatabaseService {
  /**
   * Connect to MongoDB
   * Includes connection pooling and timeout settings for Production
   */
  static async connect(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      LoggerServiceInstance.info('MongoDB already connected');
      return;
    }

    try {
      DatabaseService.setupConnectionEvents();

      const connectionOptions: ConnectOptions = {
        maxPoolSize: DATABASE_CONFIG.CONNECTION.MAX_POOL_SIZE, // Defines how many concurrent connections can be held
        serverSelectionTimeoutMS: DATABASE_CONFIG.CONNECTION.SERVER_SELECTION_TIMEOUT_MS,
        socketTimeoutMS: DATABASE_CONFIG.CONNECTION.SOCKET_TIMEOUT_MS,
      };

      LoggerServiceInstance.info('⏳ Connecting to MongoDB...');
      await mongoose.connect(config.mongo.uri, connectionOptions);
    } catch (error) {
      LoggerServiceInstance.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Close connection (Graceful Shutdown)
   */
  static async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      LoggerServiceInstance.info('MongoDB connection closed');
    }
  }

  static getConnectionStatus(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private static setupConnectionEvents(): void {
    mongoose.connection.removeAllListeners();

    mongoose.connection.on('connected', () => {
      LoggerServiceInstance.info('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      LoggerServiceInstance.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      LoggerServiceInstance.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      LoggerServiceInstance.info('🔄 MongoDB reconnected');
    });
  }
}

export default DatabaseService;
