/**
 * News Service - Fetches cryptocurrency news from external APIs
 */

import { LoggerServiceInstance } from '../utils/LoggerService.js';
import { config } from '../config/index.js';
import { NEWS_CONFIG, NEWS_API_CONFIG, CRYPTOCOMPARE_CONFIG } from '../constants/news.js';
import type {
  NewsHeadline,
  CryptoCompareResponse,
  NewsAPIResponse,
  NewsAPIArticle,
} from '../types/news.js';

export class NewsService {
  /**
   * Sort headlines by date (newest first) and limit to MAX_HEADLINES
   */
  private sortAndLimitHeadlines(headlines: NewsHeadline[]): NewsHeadline[] {
    return headlines
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, NEWS_CONFIG.MAX_HEADLINES);
  }

  /**
   * Fetch headlines with Fallback strategy
   * 1. CryptoCompare (Primary - Realtime, 11k req/mo)
   * 2. NewsAPI (Backup)
   */
  async fetchHeadlines(symbol: string): Promise<NewsHeadline[]> {
    // 1. Priority: CryptoCompare
    try {
      const headlines = await this.fetchFromCryptoCompare(symbol);
      if (headlines.length > 0) {
        return headlines;
      }
      LoggerServiceInstance.debug(`CryptoCompare yielded no results for ${symbol}, trying fallback...`);
    } catch (error) {
      LoggerServiceInstance.warn(`CryptoCompare failed for ${symbol}`, error);
    }

    // 2. Fallback: NewsAPI
    try {
      const headlines = await this.fetchFromNewsAPI(symbol);
      if (headlines.length > 0) {
        return headlines;
      }
    } catch (error) {
      LoggerServiceInstance.warn(`NewsAPI failed for ${symbol}`, error);
    }

    LoggerServiceInstance.info(`No headlines found for ${symbol} from any source.`);
    return [];
  }

  /**
   * Primary Source: CryptoCompare
   * Docs: https://min-api.cryptocompare.com/documentation?key=News&cat=v2News
   */
  private async fetchFromCryptoCompare(symbol: string): Promise<NewsHeadline[]> {
    const apiKey = config.news.cryptoCompareApiKey;
    if (!apiKey) {
      LoggerServiceInstance.warn('CryptoCompare API key is missing');
      throw new Error('Missing CryptoCompare API Key');
    }

    const url = `${config.news.cryptoCompareBaseUrl}/data/v2/news/?lang=EN&categories=${symbol}&api_key=${apiKey}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CryptoCompare error: ${response.status}`);
      }

      const data = await response.json() as CryptoCompareResponse;

      if (!data.Data || !Array.isArray(data.Data) || data.Data.length === 0) {
        LoggerServiceInstance.debug(`CryptoCompare returned no results for ${symbol}`);
        return [];
      }

      const headlines: NewsHeadline[] = [];
      const now = new Date().getTime();
      const timeWindow = NEWS_CONFIG.TIME_WINDOW_HOURS * 60 * 60 * 1000;

      for (const item of data.Data) {
        const publishedAt = item.published_on * 1000;
        
        if (now - publishedAt <= timeWindow) {
          headlines.push({
            title: item.title,
            source: `${CRYPTOCOMPARE_CONFIG.SOURCE_PREFIX} (${item.source_info?.name || CRYPTOCOMPARE_CONFIG.DEFAULT_SOURCE})`,
            publishedAt: new Date(publishedAt).toISOString(),
            url: item.url
          });
        }
      }

      return this.sortAndLimitHeadlines(headlines);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Fallback Source: NewsAPI
   * STRATEGY: "Better late than never"
   * Due to 24h delay on free tier, we must request a 48h window to catch "yesterday's" news.
   */
  private async fetchFromNewsAPI(symbol: string): Promise<NewsHeadline[]> {
    LoggerServiceInstance.debug(`Fetching headlines from NewsAPI for ${symbol}`);
    const apiKey = config.news.newsApiKey;
    
    if (!apiKey) return [];

    const fallbackTimeWindow = NEWS_API_CONFIG.FALLBACK_TIME_WINDOW_HOURS; 
    
    const fromDate = new Date();
    fromDate.setHours(fromDate.getHours() - fallbackTimeWindow);
    
    // Added "crypto" to query to reduce noise
    const query = `${symbol} crypto`; 
    
    try {
      // Note: We request 48h back, but we rely on sortBy=publishedAt to give us the "freshest stale" news first.
      const url = `${config.news.newsApiBaseUrl}/everything?q=${encodeURIComponent(query)}&from=${fromDate.toISOString()}&sortBy=publishedAt&language=en&pageSize=${NEWS_CONFIG.MAX_HEADLINES}&apiKey=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        LoggerServiceInstance.warn(`NewsAPI error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json() as NewsAPIResponse;
      if (!data.articles || !Array.isArray(data.articles)) return [];

      const headlines: NewsHeadline[] = data.articles.map((article: NewsAPIArticle) => ({
        title: article.title,
        source: `${NEWS_API_CONFIG.SOURCE_PREFIX} (${article.source?.name || NEWS_API_CONFIG.UNKNOWN_SOURCE})`,
        publishedAt: article.publishedAt,
        url: article.url
      }));

      const sortedHeadlines = this.sortAndLimitHeadlines(headlines);
      LoggerServiceInstance.info(`Fetched ${sortedHeadlines.length} headlines from NewsAPI (Fallback mode) for ${symbol}`);
      return sortedHeadlines;
    } catch (error) {
      LoggerServiceInstance.warn(`NewsAPI fallback failed for ${symbol}`, error);
      return [];
    }
  }
}

export default new NewsService();
