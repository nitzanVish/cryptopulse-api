/**
 * Coin Config Repository - Data access layer for CoinConfig model
 */

import { CoinConfig, ICoinConfig } from '../models/CoinConfig.js';
import { LoggerServiceInstance } from '../utils/LoggerService.js';

export class CoinConfigRepository {
  /**
   * Get all enabled coins, sorted by priority
   */
  async getEnabledCoins(): Promise<ICoinConfig[]> {
    try {
      const coins = await CoinConfig.find({ enabled: true })
        .sort({ priority: -1 })
        .lean<ICoinConfig[]>();
      
      return coins;
    } catch (error) {
      LoggerServiceInstance.error('Error getting enabled coins:', error);
      throw error;
    }
  }

  /**
   * Get coin by symbol
   */
  async findBySymbol(symbol: string): Promise<ICoinConfig | null> {
    try {
      const coin = await CoinConfig.findOne({ symbol: symbol.toUpperCase() }).lean();
      return coin as ICoinConfig | null;
    } catch (error) {
      LoggerServiceInstance.error(`Error finding coin config for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Create or update coin config
   */
  async upsert(symbol: string, enabled: boolean = true, priority: number = 0): Promise<ICoinConfig> {
    try {
      const coin = await CoinConfig.findOneAndUpdate(
        { symbol: symbol.toUpperCase() },
        { symbol: symbol.toUpperCase(), enabled, priority },
        { upsert: true, new: true }
      );

      return coin;
    } catch (error) {
      LoggerServiceInstance.error(`Error upserting coin config for ${symbol}:`, error);
      throw error;
    }
  }

}

export default new CoinConfigRepository();
