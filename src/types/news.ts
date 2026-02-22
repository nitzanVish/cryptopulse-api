/**
 * News-related type definitions
 */

export interface NewsHeadline {
  title: string;
  source: string;
  publishedAt: string;
  url?: string;
}

/**
 * CryptoCompare API Response Types
 * Docs: https://min-api.cryptocompare.com/documentation?key=News&cat=v2News
 */
export interface CryptoCompareNewsItem {
  id: string;
  guid: string;
  published_on: number; // Unix timestamp in seconds
  imageurl: string;
  title: string;
  url: string;
  source: string;
  body: string;
  tags: string;
  categories: string;
  upvotes: string;
  downvotes: string;
  lang: string;
  source_info: {
    name: string;
    img: string;
    lang: string;
  };
}

export interface CryptoCompareResponse {
  Type: number;
  Message: string;
  Promoted: CryptoCompareNewsItem[];
  Data: CryptoCompareNewsItem[];
  RateLimit: Record<string, unknown>;
  HasWarning: boolean;
}

/**
 * NewsAPI Response Types
 * Docs: https://newsapi.org/docs/endpoints/everything
 */
export interface NewsAPISource {
  id: string | null;
  name: string;
}

export interface NewsAPIArticle {
  source: NewsAPISource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string; // ISO 8601 format
  content: string | null;
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}
