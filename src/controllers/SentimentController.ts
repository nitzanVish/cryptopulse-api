/**
 * Sentiment Controller - Handles HTTP requests for sentiment data
 */

import { Request, Response, NextFunction } from 'express';
import sentimentService from '../services/SentimentService.js';
import coinConfigService from '../services/CoinConfigService.js';
import sentimentRepository from '../repositories/SentimentRepository.js';
import sentimentQueue from '../jobs/queue.js';
import { GetSentimentDto, AnalyzeSymbolsDto } from '../dtos/sentiment.dto.js';
import { getCurrentCycleId } from '../utils/cycleId.js';
import { SENTIMENT_CONFIG } from '../constants/sentiment.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import type { SentimentResponse } from '../types/sentiment.js';
import type { AnalyzeResponse } from '../types/api.js';

export class SentimentController {
  /**
   * Get sentiment for a symbol
   * GET /api/v1/sentiment/:symbol
   * Params are validated by middleware before reaching this handler
   */
  getSentiment = async (req: Request<GetSentimentDto['params']>, res: Response<SentimentResponse>, next: NextFunction): Promise<void> => {
    try {
      const { symbol } = req.params;
      const response: SentimentResponse = await sentimentService.getSentiment(symbol);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all sentiments
   * GET /api/v1/sentiment
   */
  getAllSentiments = async (_req: Request, res: Response<SentimentResponse[]>, next: NextFunction): Promise<void> => {
    try {
      const response: SentimentResponse[] = await sentimentService.getAllSentiments();
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Trigger on-demand sentiment analysis for given symbols
   * POST /api/v1/sentiment/analyze
   */
  analyzeSymbols = async (
    req: Request<object, unknown, AnalyzeSymbolsDto['body']>,
    res: Response<AnalyzeResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { symbols } = req.body;

      const recentSet = await sentimentRepository.findRecentBySymbols(
        symbols,
        SENTIMENT_CONFIG.RECENT_ANALYSIS_WINDOW_MS
      );

      const toQueue = symbols.filter((s) => !recentSet.has(s));
      const skipped = symbols.filter((s) => recentSet.has(s));

      if (toQueue.length > 0) {
        await coinConfigService.ensureCoinsExist(toQueue);
        const cycleId = `ondemand-${getCurrentCycleId()}`;
        await sentimentQueue.addJobs(toQueue, cycleId);
      }

      res.status(HTTP_STATUS.ACCEPTED).json({ queued: toQueue, skipped });
    } catch (error) {
      next(error);
    }
  };
}

export default new SentimentController();
