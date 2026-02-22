/**
 * Sentiment Model - Mongoose Schema
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { SentimentAnalysisResult } from '../types/sentiment';
import { AI_CONFIG } from '../constants/ai';

export interface ISentiment extends Document, Omit<SentimentAnalysisResult, 'analyzedAt'> {
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SentimentSchema = new Schema<ISentiment>(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
    },
    sentimentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    sentimentLabel: {
      type: String,
      required: true,
      enum: AI_CONFIG.VALID_SENTIMENT_LABELS,
    },
    summary: {
      type: String,
      required: true,
    },
    sourceHeadlines: {
      type: [
        {
          title: String,
          source: String,
          publishedAt: String,
          url: String,
        },
      ],
      required: true,
      default: [],
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastArticleDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries (symbol + analyzedAt)
// This covers queries by symbol and sorting by analyzedAt
SentimentSchema.index({ symbol: 1, analyzedAt: -1 });

export const Sentiment = mongoose.model<ISentiment>('Sentiment', SentimentSchema);
