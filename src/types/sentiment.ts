/**
 * Sentiment-related type definitions
 */

import type { NewsHeadline } from './news';

export interface SentimentAnalysisResult {
  symbol: string;
  sentimentScore: number; // 0-100
  sentimentLabel: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  sourceHeadlines: NewsHeadline[];
  analyzedAt: Date;
  lastArticleDate: Date; // Date of the newest article analyzed
}

export interface SentimentResponse {
  symbol: string;
  status: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  summary: string;
  updatedAt: string;
  lastArticleDate: string; // Date of the newest article analyzed
}
