/**
 * Job/Queue-related type definitions
 */

export interface JobData {
  symbol: string;
}

export interface AdminJobStatusItem {
  jobId: string;
  symbol: string;
  cycleId: string;
  status: string;
  finishedAt: string | null;
  failedReason: string | null;
}
