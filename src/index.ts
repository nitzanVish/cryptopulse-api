/**
 * Application Entry Point
 * Creates the app instance, initializes it, and starts the server
 */

import http from 'http';
import { App } from './app.js';
import { LoggerServiceInstance } from './utils/LoggerService.js';
import { config } from './config/index.js';

const startServer = async (): Promise<void> => {
  try {
    // 1. Create app instance
    const app = new App();

    // 2. Initialize (setup routes, middlewares, connect to DB, etc.)
    await app.init();

    // 3. Create HTTP server and start listening
    const server = http.createServer(app.getApp());

    server.listen(config.port, () => {
      LoggerServiceInstance.info(`🚀 Server is running on port ${config.port} (${config.env})`);
    });

    // 4. Setup graceful shutdown handlers
    const shutdown = async (signal: string) => {
      LoggerServiceInstance.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

      // Close HTTP server (stop accepting new requests)
      // Close DB connections and workers (cleanup resources)
      server.close(async () => {
        LoggerServiceInstance.info('HTTP server closed.');
        await app.stop();
        process.exit(0);
      });
    };

    // Handle termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (err: Error) => {
      LoggerServiceInstance.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
      server.close(() => {
        app.stop().then(() => process.exit(1));
      });
    });

    process.on('unhandledRejection', (err: unknown) => {
      LoggerServiceInstance.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
      server.close(() => {
        app.stop().then(() => process.exit(1));
      });
    });
  } catch (error) {
    LoggerServiceInstance.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
