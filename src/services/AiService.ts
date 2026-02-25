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
   */
  private parseResponse(text: string): GeminiAnalysisResponse {
    try {
      // Clean any Markdown remnants (Gemini sometimes wraps JSON in code blocks)
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed: RawGeminiResponse = JSON.parse(cleanText);

      // Validate and normalize each field
      const sentimentScore = this.normalizeSentimentScore(parsed.sentimentScore);
      const sentimentLabel = this.normalizeSentimentLabel(parsed.sentimentLabel);
      const summary = this.normalizeSummary(parsed.summary, AI_CONFIG.ANALYSIS_COMPLETED_MESSAGE);

      return {
        sentimentScore,
        sentimentLabel,
        summary,
      };

    } catch (error) {
      LoggerServiceInstance.error('Failed to parse Gemini JSON response', { text, error });
      throw new ApiError('Invalid JSON format from AI', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

export default new AiService();
