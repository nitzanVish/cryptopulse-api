/**
 * AI Prompt Templates
 */

export const GEMINI_PROMPT_TEMPLATE = `
Act as a Senior Crypto Market Analyst. 
Analyze the following news headlines for "{{SYMBOL}}" and determine the immediate market sentiment.

HEADLINES:
{{HEADLINES}}

INSTRUCTIONS:
1. Analyze the emotional tone and financial implication of each headline.
2. Ignore spam or irrelevant headlines.
3. Determine a sentiment score (0-100).
4. Provide a ONE sentence summary.

OUTPUT FORMAT (JSON):
{
  "sentimentScore": <number 0-100>,
  "sentimentLabel": <"Bullish", "Bearish", or "Neutral">,
  "summary": <string>
}
`;

/**
 * Build Gemini prompt by replacing placeholders
 */
export function buildGeminiPrompt(symbol: string, headlines: string[]): string {
  const headlinesText = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');
  return GEMINI_PROMPT_TEMPLATE
    .replace('{{SYMBOL}}', symbol)
    .replace('{{HEADLINES}}', headlinesText);
}
