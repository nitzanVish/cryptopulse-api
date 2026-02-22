/**
 * Coin Configuration Model - Tracks which coins to analyze
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICoinConfig extends Document {
  symbol: string;
  enabled: boolean;
  priority: number; // Higher priority = analyzed first
  createdAt: Date;
  updatedAt: Date;
}

const CoinConfigSchema = new Schema<ICoinConfig>(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient query: find({ enabled: true }).sort({ priority: -1 })
// This covers filtering by enabled and sorting by priority in a single index
CoinConfigSchema.index({ enabled: 1, priority: -1 });

export const CoinConfig = mongoose.model<ICoinConfig>('CoinConfig', CoinConfigSchema);
