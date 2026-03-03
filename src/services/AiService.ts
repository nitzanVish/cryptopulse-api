/**
 * AI Service - Analyzes sentiment using Google Gemini API
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ApiError } from '../utils/errors.js';
import { LoggerServiceInstance } from '../utils/LoggerService.js';
import { config } from '../config/index.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AI_CONFIG } from '../constants/ai.js';
import { buildGeminiPrompt } from '../constants/prompts.js';
import type { GeminiAnalysisResponse, SentimentLabel, RawGeminiResponse } from '../types/ai.js';

export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error('Gemini API Key is missing!');
    }

    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    
    // Use gemini-pro model
    this.model = this.genAI.getGenerativeModel({ 
      model: AI_CONFIG.MODEL_NAME
    });
  }

  /**
   * Analyze sentiment from headlines
   */
  async analyzeSentiment(symbol: string, headlines: string[]): Promise<GeminiAnalysisResponse> {
    // Guard: if no headlines, return neutral instead of throwing error
    if (!headlines || headlines.length === 0) {
      LoggerServiceInstance.warn(`No headlines provided for ${symbol}, returning neutral.`);
      return this.createNeutralResponse(AI_CONFIG.NO_NEWS_MESSAGE);
    }

    try {
      const prompt = this.buildPrompt(symbol, headlines);
      
      // Send to Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse response
      const analysis = this.parseResponse(text);
      LoggerServiceInstance.info(`AI Analysis for ${symbol}: ${analysis.sentimentLabel} (${analysis.sentimentScore})`);
      
      return analysis;

    } catch (error) {
      LoggerServiceInstance.error(`Failed to analyze sentiment for ${symbol}`, error);
      
      // Return neutral fallback instead of throwing error to prevent system failure
      return this.createNeutralResponse(AI_CONFIG.ANALYSIS_FAILED_MESSAGE);
    }
  }

  private buildPrompt(symbol: string, headlines: string[]): string {
    return buildGeminiPrompt(symbol, headlines);
  }

  /**
   * Create a neutral sentiment response
   */
  private createNeutralResponse(summary: string): GeminiAnalysisResponse {
    return {
      sentimentScore: AI_CONFIG.DEFAULT_SENTIMENT_SCORE,
      sentimentLabel: AI_CONFIG.DEFAULT_SENTIMENT_LABEL,
      summary,
    };
  }

  /**
   * Validate and normalize sentiment score
   */
  private normalizeSentimentScore(score: unknown): number {
    if (typeof score !== 'number') {
      return AI_CONFIG.DEFAULT_SENTIMENT_SCORE;
    }
    return Math.max(AI_CONFIG.MIN_SCORE, Math.min(AI_CONFIG.MAX_SCORE, Math.round(score)));
  }

  /**
   * Validate and normalize sentiment label
   */
  private normalizeSentimentLabel(label: unknown): SentimentLabel {
    if (typeof label !== 'string') {
      return AI_CONFIG.DEFAULT_SENTIMENT_LABEL;
    }
    return AI_CONFIG.VALID_SENTIMENT_LABELS.includes(label as SentimentLabel)
      ? (label as SentimentLabel)
      : AI_CONFIG.DEFAULT_SENTIMENT_LABEL;
  }

  /**
   * Validate and normalize summary
   */
  private normalizeSummary(summary: unknown, fallback: string): string {
    if (typeof summary !== 'string' || summary.length === 0) {
      return fallback;
    }
    return summary.trim();
  }

  /**
   * Parse and validate the Gemini response
   * Handles: raw JSON, markdown-wrapped (```json ... ```), and array of analyses
   */
  private parseResponse(text: string): GeminiAnalysisResponse {
    try {
      let cleanText = text.trim();
      // Strip markdown code fences (```json ... ``` or ``` ... ```)
      const codeFenceMatch = cleanText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
      if (codeFenceMatch) {
        cleanText = codeFenceMatch[1].trim();
      }

      // Try to parse as JSON (object or array)
      const parsed = JSON.parse(cleanText) as RawGeminiResponse | RawGeminiResponse[];

      const single = Array.isArray(parsed) ? this.aggregateAnalyses(parsed) : parsed;

      const sentimentScore = this.normalizeSentimentScore(single.sentimentScore);
      const sentimentLabel = this.normalizeSentimentLabel(single.sentimentLabel);
      const summary = this.normalizeSummary(single.summary, AI_CONFIG.ANALYSIS_COMPLETED_MESSAGE);

      return {
        sentimentScore,
        sentimentLabel,
        summary,
      };
    } catch (error) {
      // Fallback: try extracting first JSON object/array
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
          return this.parseResponse(jsonMatch[0]);
        }
      } catch {
        // ignore
      }
      LoggerServiceInstance.error('Failed to parse Gemini JSON response', { text, error });
      throw new ApiError('Invalid JSON format from AI', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /** Aggregate array of per-headline analyses into a single response */
  private aggregateAnalyses(items: RawGeminiResponse[]): RawGeminiResponse {
    const valid = items.filter((i): i is RawGeminiResponse => i != null && typeof i === 'object');
    if (valid.length === 0) {
      return {
        sentimentScore: AI_CONFIG.DEFAULT_SENTIMENT_SCORE,
        sentimentLabel: AI_CONFIG.DEFAULT_SENTIMENT_LABEL,
        summary: AI_CONFIG.ANALYSIS_COMPLETED_MESSAGE,
      };
    }
    const scores = valid.map((i) =>
      typeof i.sentimentScore === 'number' ? i.sentimentScore : AI_CONFIG.DEFAULT_SENTIMENT_SCORE
    );
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const labels = valid.map((i) => this.normalizeSentimentLabel(i.sentimentLabel));
    const labelCounts = labels.reduce<Record<string, number>>((acc, l) => {
      acc[l] = (acc[l] ?? 0) + 1;
      return acc;
    }, {});
    const dominantLabel =
      Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? AI_CONFIG.DEFAULT_SENTIMENT_LABEL;
    const firstSummary = valid.find((i) => typeof i.summary === 'string' && i.summary.trim());
    const summary = firstSummary?.summary?.trim() ?? AI_CONFIG.ANALYSIS_COMPLETED_MESSAGE;
    return { sentimentScore: avgScore, sentimentLabel: dominantLabel, summary };
  }
}

export default new AiService();
