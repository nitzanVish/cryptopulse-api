/**
 * Cycle ID utility — deterministic ID for job batching
 * Round down to the start of the current hour (UTC) for consistent cycleId across scheduler and on-demand.
 */

export function getCurrentCycleId(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString(); // e.g. 2026-02-26T12:00:00.000Z
}
