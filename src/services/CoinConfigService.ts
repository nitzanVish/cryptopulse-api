/**
 * Coin Config Service - Business logic layer for coin configuration
 */

import coinConfigRepository from '../repositories/CoinConfigRepository.js';
import { SENTIMENT_CONFIG } from '../constants/sentiment.js';
import type { ICoinConfig } from '../models/CoinConfig.js';

export class CoinConfigService {
  /**
   * Get all enabled coins
   */
  async getEnabledCoins(): Promise<ICoinConfig[]> {
    return await coinConfigRepository.getEnabledCoins();
  }

  /**
   * Get coin by symbol
   */
  async getCoinBySymbol(symbol: string): Promise<ICoinConfig | null> {
    return await coinConfigRepository.findBySymbol(symbol);
  }

  /**
   * Ensures all given symbols exist in CoinConfig with enabled: true and given priority.
   * Used when adding coins via on-demand sentiment analysis.
   */
  async ensureCoinsExist(symbols: string[], priority?: number): Promise<void> {
    const prio = priority ?? SENTIMENT_CONFIG.ON_DEMAND_PRIORITY;
    await Promise.all(
      symbols.map((symbol) =>
        coinConfigRepository.upsert(symbol, true, prio)
      )
    );
  }
}

export default new CoinConfigService();
