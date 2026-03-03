/**
 * API response type definitions
 */

import type { AdminJobStatusItem } from './job.js';

/** POST /api/v1/sentiment/analyze response (202 Accepted) */
export interface AnalyzeResponse {
  queued: string[];
  skipped: string[];
}

/** GET /api/v1/admin/sentiment/status response */
export interface AdminStatusResponse {
  stats: { waiting: number; active: number; completed: number; failed: number };
  jobs: AdminJobStatusItem[];
}

/** GET /health response */
export interface HealthResponse {
  status: string;
  timestamp: string;
  services: { database: string; redis: string; bullmq: string };
  error?: string;
}

/** GET / root response */
export interface RootInfoResponse {
  message: string;
  version: string;
}
