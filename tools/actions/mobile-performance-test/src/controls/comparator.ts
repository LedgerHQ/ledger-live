import type { PerformanceStats } from "../models/performance";

/**
 * Compare two stats objects and return the delta
 *
 * @param current
 * The current stats object
 *
 * @param previous
 * The previous stats object
 *
 * @returns
 * The delta between the two stats objects
 */
export function compareStats(
  current: PerformanceStats,
  previous: PerformanceStats,
): PerformanceStats {
  return {
    count: current.count - previous.count,
    mean: current.mean - previous.mean,
    median: current.median - previous.median,
    min: current.min < previous.min ? current.min : previous.min,
    max: current.max > previous.max ? current.max : previous.max,
    p75: current.p75 - previous.p75,
    p95: current.p95 - previous.p95,
    p99: current.p99 - previous.p99,
    stdDev: current.stdDev - previous.stdDev,
  };
}
