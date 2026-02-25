/**
 * Sentiment Repository - Data access layer for Sentiment model
 */

import { Sentiment } from '../models/Sentiment.js';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import type { SentimentAnalysisResult } from '../types/sentiment.js';

export class SentimentRepository {
  /**
   * Get the latest sentiment analysis for a symbol
   */
  async findBySymbol(symbol: string): Promise<SentimentAnalysisResult | null> {
    try {
      const sentiment = await Sentiment.findOne({ symbol: symbol.toUpperCase() })
        .lean<SentimentAnalysisResult>();
      
      return sentiment;
    } catch (error) {
      LoggerServiceInstance.error(`Error finding sentiment for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Create or update sentiment analysis
   */
  async upsert(sentimentData: SentimentAnalysisResult): Promise<SentimentAnalysisResult> {
    try {
      const sentiment = await Sentiment.findOneAndUpdate(
        { symbol: sentimentData.symbol.toUpperCase() },
        {
          ...sentimentData,
          symbol: sentimentData.symbol.toUpperCase(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      ).lean<SentimentAnalysisResult>();

      return sentiment;
    } catch (error) {
      LoggerServiceInstance.error(`Error upserting sentiment for ${sentimentData.symbol}:`, error);
      throw error;
    }
  }

  /**
   * Update only analyzedAt timestamp for a symbol
   */
  async updateAnalyzedAt(symbol: string): Promise<void> {
    try {
      await Sentiment.updateOne(
        { symbol: symbol.toUpperCase() },
        { $set: { analyzedAt: new Date() } }
      );
    } catch (error) {
      LoggerServiceInstance.error(`Error updating analyzedAt for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get all sentiments
   */
  async findAll(): Promise<SentimentAnalysisResult[]> {
    try {
      const sentiments = await Sentiment.find()
        .sort({ analyzedAt: -1 })
        .lean();
      
      return sentiments as SentimentAnalysisResult[];
    } catch (error) {
      LoggerServiceInstance.error('Error finding all sentiments:', error);
      throw error;
    }
  }

}

export default new SentimentRepository();
