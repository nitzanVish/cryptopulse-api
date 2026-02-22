/**
 * Seed script to initialize coin configurations in the database
 * Run with: npm run seed:coins or tsx scripts/seedCoins.ts
 */

import 'dotenv/config';
import DatabaseService from '../src/services/DatabaseService';
import coinConfigRepository from '../src/repositories/CoinConfigRepository';
import { LoggerServiceInstance } from '../src/utils/LoggerService';

const coins = [
  { symbol: 'BTC', enabled: true, priority: 100 },
  { symbol: 'ETH', enabled: true, priority: 95 },
  { symbol: 'SOL', enabled: true, priority: 90 },
  { symbol: 'BNB', enabled: true, priority: 85 },
  { symbol: 'XRP', enabled: true, priority: 80 },
  { symbol: 'ADA', enabled: true, priority: 75 },
  { symbol: 'AVAX', enabled: true, priority: 70 },
  { symbol: 'DOGE', enabled: true, priority: 65 },
  { symbol: 'DOT', enabled: true, priority: 60 },
  { symbol: 'LINK', enabled: true, priority: 55 },
  { symbol: 'MATIC', enabled: true, priority: 50 },
  { symbol: 'SHIB', enabled: true, priority: 45 },
  { symbol: 'LTC', enabled: true, priority: 40 },
  { symbol: 'TRX', enabled: true, priority: 35 },
  { symbol: 'UNI', enabled: true, priority: 30 },
  { symbol: 'ATOM', enabled: true, priority: 25 },
  { symbol: 'ETC', enabled: true, priority: 20 },
  { symbol: 'FIL', enabled: true, priority: 15 },
  { symbol: 'NEAR', enabled: true, priority: 10 },
  { symbol: 'ALGO', enabled: true, priority: 5 },
];

async function seedCoins(): Promise<void> {
  try {
    LoggerServiceInstance.info('🔄 Starting coin seeding...');

    // Connect to database
    await DatabaseService.connect();
    LoggerServiceInstance.info('✅ Connected to database');

    // Insert/update coins
    let successCount = 0;
    let errorCount = 0;

    for (const coin of coins) {
      try {
        await coinConfigRepository.upsert(coin.symbol, coin.enabled, coin.priority);
        LoggerServiceInstance.info(`✅ Upserted ${coin.symbol} (priority: ${coin.priority})`);
        successCount++;
      } catch (error) {
        LoggerServiceInstance.error(`❌ Failed to upsert ${coin.symbol}:`, error);
        errorCount++;
      }
    }

    LoggerServiceInstance.info(`\n📊 Summary:`);
    LoggerServiceInstance.info(`   ✅ Success: ${successCount}`);
    LoggerServiceInstance.info(`   ❌ Errors: ${errorCount}`);
    LoggerServiceInstance.info(`   📦 Total: ${coins.length}`);

    // Disconnect
    await DatabaseService.disconnect();
    LoggerServiceInstance.info('✅ Database connection closed');
    LoggerServiceInstance.info('🎉 Coin seeding completed!');

    process.exit(0);
  } catch (error) {
    LoggerServiceInstance.error('💥 Fatal error during coin seeding:', error);
    await DatabaseService.disconnect();
    process.exit(1);
  }
}

// Run the script
seedCoins();
