/**
 * Sentiment Controller - Handles HTTP requests for sentiment data
 */

import { Request, Response, NextFunction } from 'express';
import sentimentService from '../services/SentimentService.js';
import { GetSentimentDto } from '../dtos/sentiment.dto.js';

export class SentimentController {
  /**
   * Get sentiment for a symbol
   * GET /api/v1/sentiment/:symbol
   * Params are validated by middleware before reaching this handler
   */
  getSentiment = async (req: Request<GetSentimentDto['params']>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { symbol } = req.params;
      const response = await sentimentService.getSentiment(symbol);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all sentiments
   * GET /api/v1/sentiment
   */
  getAllSentiments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response = await sentimentService.getAllSentiments();
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}

export default new SentimentController();
