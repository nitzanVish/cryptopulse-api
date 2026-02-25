/**
 * Coin Config Service - Business logic layer for coin configuration
 */

import coinConfigRepository from '../repositories/CoinConfigRepository.js';
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
}

export default new CoinConfigService();
