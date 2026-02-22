/**
 * Application Setup and Configuration
 * Prepares the Express app but doesn't start the server
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { LoggerServiceInstance } from './utils/LoggerService';
import DatabaseService from './services/DatabaseService';
import RedisService from './services/RedisService';
import sentimentRoutes from './routes/sentimentRoutes';
import sentimentWorker from './jobs/worker';
import sentimentScheduler from './jobs/scheduler';
import { requestLogger } from './middlewares/logger.middleware';
import { globalErrorHandler } from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { HealthController } from './controllers/HealthController';
import { RootController } from './controllers/RootController';
import { NotFoundError } from './utils/errors';
import { MESSAGES } from './constants/messages';

export class App {
  private app: Application;

  constructor() {
    this.app = express();
  }

  /**
   * Initialize the application - setup routes, middlewares, and connect to infrastructure
   */
  public async init(): Promise<void> {
    this.setupSecurity();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();

    await this.connectInfrastructure();
  }


  /**
   * Stop the application gracefully - closes infrastructure connections
   * Note: HTTP server closing is handled in index.ts
   */
  public async stop(): Promise<void> {
    try {
      await sentimentScheduler.stop();
      await sentimentWorker.stop();
      await RedisService.disconnect();
      await DatabaseService.disconnect();

      LoggerServiceInstance.info('✅ Application shutdown completed.');
    } catch (err: unknown) {
      LoggerServiceInstance.error('❌ Error during shutdown cleanup', err);
      throw err;
    }
  }

  private setupSecurity(): void {
    // Helmet helps secure Express apps by setting various HTTP headers
    this.app.use(helmet());
    // CORS configuration for cross-origin requests
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: true,
      })
    );
    // Rate limiting - protect API from abuse
    this.app.use(globalRateLimiter);
  }

  private setupMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // Compression middleware - compresses response bodies (not requests)
    // Automatically compresses responses using gzip/deflate, reducing bandwidth usage
    this.app.use(compression());
    // Request logging middleware for tracking HTTP requests
    this.app.use(requestLogger);
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', HealthController.check);

    // Root endpoint
    this.app.get('/', RootController.getInfo);

    // API routes
    this.app.use('/api/v1/sentiment', sentimentRoutes);

    // 404 Catch-all - Must be last route
    this.app.all('*', (req: Request, _res: Response, next: NextFunction) => {
      next(new NotFoundError(MESSAGES.ERRORS.ROUTE_NOT_FOUND(req.originalUrl)));
    });
  }

  private setupErrorHandling(): void {
    // Global error handler - catches all errors and formats them consistently
    this.app.use(globalErrorHandler);
  }

  private async connectInfrastructure(): Promise<void> {
    await DatabaseService.connect();
    await RedisService.connect();
    sentimentWorker.start();
    await sentimentScheduler.start();
  }

  getApp(): Application {
    return this.app;
  }
}
