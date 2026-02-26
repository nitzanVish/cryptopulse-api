/**
 * Admin queue service - read-only helpers for inspecting BullMQ jobs
 */

import type { Job } from 'bullmq';
import sentimentQueue from './queue.js';
import { ADMIN_JOB_STATUSES, ADMIN_STATUS_DEFAULT_LIMIT, ADMIN_STATUS_MAX_LIMIT } from '../constants/job.js';
import { ADMIN_JOB_STATUS_LABELS, ADMIN_PLACEHOLDER } from '../constants/admin.js';
import type { AdminJobStatusItem, JobData } from '../types/job.js';

export const ADMIN_STATUS_LIMITS = {
  DEFAULT: ADMIN_STATUS_DEFAULT_LIMIT,
  MAX: ADMIN_STATUS_MAX_LIMIT,
} as const;

export async function getJobsForAdmin(rawLimit?: number): Promise<AdminJobStatusItem[]> {
  const limit = normalizeLimit(rawLimit);
  const queue = sentimentQueue.getQueue();

  // false => newest jobs first; spread readonly array to satisfy BullMQ's mutable parameter type
  const jobs = await queue.getJobs([...ADMIN_JOB_STATUSES], 0, limit, false);

  const results = jobs.map((job) => {
    const jobIdStr = String((job as Job).id ?? job.name ?? '');
    const { symbol: parsedSymbol, cycleId } = parseJobId(jobIdStr);

    // Infer status from job fields (no async getState call); we already fetched by these statuses
    const status = inferJobStatus(job as Job);

    const data = job.data as JobData | undefined;

    return {
      jobId: jobIdStr,
      symbol: parsedSymbol ?? data?.symbol ?? ADMIN_PLACEHOLDER,
      cycleId: cycleId ?? ADMIN_PLACEHOLDER,
      status,
      finishedAt:
        (job as Job).finishedOn != null
          ? new Date((job as Job).finishedOn as number).toISOString()
          : null,
      failedReason: (job as Job).failedReason ?? null,
    };
  });

  return results;
}

/** Infer status from job fields (avoid async getState for each job) */
function inferJobStatus(job: Job): string {
  if (job.failedReason != null) return ADMIN_JOB_STATUS_LABELS.FAILED;
  if (job.finishedOn != null) return ADMIN_JOB_STATUS_LABELS.COMPLETED;
  return ADMIN_JOB_STATUS_LABELS.ACTIVE;
}

function normalizeLimit(rawLimit?: number): number {
  const n = Number.isFinite(rawLimit) && rawLimit && rawLimit > 0 ? rawLimit : ADMIN_STATUS_DEFAULT_LIMIT;
  return Math.min(n, ADMIN_STATUS_MAX_LIMIT);
}

/** Parse jobId "analyze-sentiment-SYMBOL-cycleId" into { symbol, cycleId } */
function parseJobId(jobId: string): { symbol: string; cycleId: string } {
  if (!jobId || typeof jobId !== 'string') return { symbol: ADMIN_PLACEHOLDER, cycleId: ADMIN_PLACEHOLDER };
  const parts = jobId.split('-');
  if (parts.length < 4) return { symbol: parts[2] ?? ADMIN_PLACEHOLDER, cycleId: ADMIN_PLACEHOLDER };
  return {
    symbol: parts[2] ?? ADMIN_PLACEHOLDER,
    cycleId: parts.slice(3).join('-'),
  };
}

