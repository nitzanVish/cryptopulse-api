/**
 * Sentiment Service - Orchestrates news fetching, AI analysis, and storage
 */

import { LoggerServiceInstance } from '../utils/LoggerService.js';
import newsService from './NewsService.js';
import aiService from './AiService.js';
import sentimentRepository from '../repositories/SentimentRepository.js';
import RedisService from './RedisService.js';
import { NotFoundError } from '../utils/errors.js';
import type { SentimentAnalysisResult, SentimentResponse } from '../types/sentiment.js';
import { SENTIMENT_CONFIG } from '../constants/sentiment.js';
import { MESSAGES } from '../constants/messages.js';

export class SentimentService {
  /**
   * Analyze sentiment for a symbol (main orchestrator)
   * Results are saved to DB and cache automatically
   */
  async analyzeSymbol(symbol: string): Promise<void> {
    const symbolUpper = symbol.toUpperCase();
    LoggerServiceInstance.info(`Starting sentiment analysis for ${symbolUpper}`);

    try {
      // Step 1: Fetch news headlines (last 24h)
      const headlines = await newsService.fetchHeadlines(symbolUpper);
      
      // If no headlines at all - save neutral sentiment
      if (headlines.length === 0) {
        LoggerServiceInstance.warn(`No headlines found for ${symbolUpper}, using neutral sentiment`);
        await this.saveAndCacheResult(this.createNeutralSentiment(symbolUpper));
        return;
      }

      // Step 2: Find the date of the newest article
      const sortedHeadlines = this.sortHeadlinesByDate(headlines);
      const newestArticleDate = new Date(sortedHeadlines[0].publishedAt);

      // Step 3: Check Redis first for quick date comparison
      const cacheKey = `sentiment:${symbolUpper}`;
      const cached = await RedisService.get<SentimentAnalysisResult>(cacheKey);
      
      // If cached data exists and has lastArticleDate, check if we need to analyze
      if (cached?.lastArticleDate) {
        const cachedLastArticleDate = new Date(cached.lastArticleDate);
        
        // If newest article is not newer than cached last article, skip AI analysis
        if (newestArticleDate <= cachedLastArticleDate) {
          LoggerServiceInstance.debug(
            `No NEW articles for ${symbolUpper} (Latest: ${newestArticleDate.toISOString()}). Skipping AI.`
          );
          
          await this.refreshAnalysisTimestamp(symbolUpper, cached);
          return;
        }
      }

      // Step 4: Get last analysis from database
      const lastAnalysis = await this.getLastAnalysisFromDB(symbolUpper);
      
      // If there's a previous analysis, and the newest article we have now is NOT newer than the last article we analyzed
      // It means nothing new came in. This is just "noise" from old articles.
      if (
        lastAnalysis?.lastArticleDate &&
        newestArticleDate <= new Date(lastAnalysis.lastArticleDate)
      ) {
        LoggerServiceInstance.debug(
          `No NEW articles for ${symbolUpper} (Latest: ${newestArticleDate.toISOString()}). Skipping AI.`
        );
        
        await this.refreshAnalysisTimestamp(symbolUpper, lastAnalysis);
        return;
      }

      // Step 5: there's a new article
      LoggerServiceInstance.info(
        `⚡ New content detected for ${symbolUpper} (Latest: ${newestArticleDate.toISOString()}). Calling AI Service...`
      );
      
      // Extract titles for AI analysis
      const titles = sortedHeadlines.map((h) => h.title);
      const analysis = await aiService.analyzeSentiment(symbolUpper, titles);

      const result: SentimentAnalysisResult = {
        symbol: symbolUpper,
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        summary: analysis.summary,
        sourceHeadlines: sortedHeadlines,
        analyzedAt: new Date(),
        lastArticleDate: newestArticleDate,
      };

      await this.saveAndCacheResult(result);
    } catch (error) {
      LoggerServiceInstance.error(`Error analyzing sentiment for ${symbolUpper}:`, error);
      throw error;
    }
  }

  /**
   * Refresh analysis timestamp when no new articles are found
   * Efficiently updates only analyzedAt in DB and refreshes cache
   * 
   * @param symbol - The symbol to refresh
   * @param existingData - Cached SentimentAnalysisResult (dates may be strings from Redis)
   */
  private async refreshAnalysisTimestamp(
    symbol: string,
    existingData: SentimentAnalysisResult
  ): Promise<void> {
    // Update only analyzedAt in DB (more efficient than fetching full document)
    await sentimentRepository.updateAnalyzedAt(symbol);

    // Update cache with new timestamp
    // Normalize dates (handle both Date objects and strings from Redis)
    const lastArticleDate = existingData.lastArticleDate instanceof Date
      ? existingData.lastArticleDate
      : new Date(existingData.lastArticleDate);

    const cacheValue: SentimentAnalysisResult = {
      ...existingData,
      analyzedAt: new Date(),
      lastArticleDate,
    };
    
    const cacheKey = `sentiment:${symbol}`;
    await RedisService.set(cacheKey, cacheValue, SENTIMENT_CONFIG.CACHE_TTL);
  }

  /**
   * Save result to database and cache
   */
  private async saveAndCacheResult(result: SentimentAnalysisResult): Promise<void> {
    // Save to database
    await sentimentRepository.upsert(result);

    // Update Redis cache
    await this.updateCache(result);

    LoggerServiceInstance.info(
      `Completed sentiment analysis for ${result.symbol}: ${result.sentimentLabel} (${result.sentimentScore})`
    );
  }

  /**
   * Update Redis cache with sentiment data
   */
  private async updateCache(result: SentimentAnalysisResult): Promise<void> {
    const cacheKey = `sentiment:${result.symbol}`;
    await RedisService.set(cacheKey, result, SENTIMENT_CONFIG.CACHE_TTL);
  }

  /**
   * Get last analysis from database
   * Returns null if no analysis found
   */
  private async getLastAnalysisFromDB(symbol: string): Promise<SentimentAnalysisResult | null> {
    return await sentimentRepository.findBySymbol(symbol);
  }

  /**
   * Transform SentimentAnalysisResult to SentimentResponse (for API)
   * Handles dates from MongoDB (Date objects) or Redis (strings)
   */
  private toSentimentResponse(result: SentimentAnalysisResult): SentimentResponse {
    // MongoDB returns Date objects, Redis returns strings (from JSON.parse)
    const updatedAt = result.analyzedAt instanceof Date 
      ? result.analyzedAt.toISOString()
      : result.analyzedAt; // Already a string from Redis
    const lastArticleDate = result.lastArticleDate instanceof Date
      ? result.lastArticleDate.toISOString()
      : result.lastArticleDate; // Already a string from Redis

    return {
      symbol: result.symbol,
      status: result.sentimentLabel,
      score: result.sentimentScore,
      summary: result.summary,
      updatedAt,
      lastArticleDate,
    };
  }

  /**
   * Get sentiment for a symbol (with caching)
   * Checks Redis cache first, then database
   * Symbol is already validated and uppercase from DTO
   */
  async getSentiment(symbol: string): Promise<SentimentResponse> {
    const cacheKey = `sentiment:${symbol}`;

    // Try Redis cache first
    const cached = await RedisService.get<SentimentAnalysisResult>(cacheKey);
    if (cached) {
      LoggerServiceInstance.debug(`Cache hit for ${symbol}`);
      return this.toSentimentResponse(cached);
    }

    // Cache miss - fetch from database
    const analysisResult = await sentimentRepository.findBySymbol(symbol);
    if (!analysisResult) {
      throw new NotFoundError(`Sentiment for ${symbol}`);
    }

    // Cache the result
    await RedisService.set(cacheKey, analysisResult, SENTIMENT_CONFIG.CACHE_TTL);

    // Transform to response format for API
    return this.toSentimentResponse(analysisResult);
  }

  /**
   * Get all sentiments
   */
  async getAllSentiments(): Promise<SentimentResponse[]> {
    const sentiments = await sentimentRepository.findAll();

    return sentiments.map((sentiment) => this.toSentimentResponse(sentiment));
  }

  /**
   * Sort headlines by date (newest first)
   */
  private sortHeadlinesByDate<T extends { publishedAt: string }>(headlines: T[]): T[] {
    return [...headlines].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  /**
   * Create a neutral sentiment when no data is available
   */
  private createNeutralSentiment(symbol: string): SentimentAnalysisResult {
    return {
      symbol,
      sentimentScore: SENTIMENT_CONFIG.NEUTRAL_SCORE,
      sentimentLabel: 'Neutral',
      summary: MESSAGES.SENTIMENT.INSUFFICIENT_DATA,
      sourceHeadlines: [],
      analyzedAt: new Date(),
      lastArticleDate: new Date(), // Use current date as fallback
    };
  }
}

export default new SentimentService();
