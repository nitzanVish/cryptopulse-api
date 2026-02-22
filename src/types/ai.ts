/**
 * AI/Gemini-related type definitions
 */

export type SentimentLabel = 'Bullish' | 'Bearish' | 'Neutral';

export interface GeminiAnalysisResponse {
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  summary: string;
}

/**
 * Raw response from Gemini API
 */
export interface RawGeminiResponse {
  sentimentScore?: number;
  sentimentLabel?: string;
  summary?: string;
}
