import type { PerformanceDeltaAccuracy, PerformanceStats } from "../models/performance";

/**
 * Calculate the percentile of a list of durations
 *
 * @param durations
 * The list of durations to calculate the percentile of
 *
 * @returns
 * The percentile of the list of durations
 */
export function stats(durations: number[]): PerformanceStats {
  if (durations.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      p75: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      stdDev: 0,
    };
  }

  const m = mean(durations);
  const stdDev = standardDeviation(durations);

  return {
    count: durations.length,
    mean: Math.round(m),
    median: Math.round(percentile(durations, 50)),
    p75: Math.round(percentile(durations, 75)),
    p95: Math.round(percentile(durations, 95)),
    p99: Math.round(percentile(durations, 99)),
    min: Math.round(Math.min(...durations)),
    max: Math.round(Math.max(...durations)),
    stdDev: Math.round(stdDev),
  };
}
/**
 * Calculate the percentile of a list of values
 *
 * @param xs
 * The list of values to calculate the percentile of
 *
 * @param percentile
 * The percentile to calculate
 *
 * @returns
 * The percentile of the list of values
 */
export function percentile(xs: number[], percentile: number): number {
  if (xs.length === 0) return 0;

  const sorted = [...xs].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

/**
 * Calculate delta accuracy from individual run durations within a single test
 *
 * @param durations
 * Array of individual run durations from the same test execution (~20 runs)
 *
 * @returns
 * Delta accuracy metrics for evaluating relevance of performance variations
 */
export function deltaAccuracyFromDurations(xs: number[]): PerformanceDeltaAccuracy {
  if (xs.length < 3) {
    return {
      meanVariation: 0,
      medianVariation: 0,
      p75Variation: 0,
      p95Variation: 0,
      maxDelta: 0,
      minDelta: 0,
      relevanceScore: 0,
      isSignificant: false,
    };
  }

  // Calculate basic statistics
  const mean = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const maxDelta = max - min;
  const minDelta = mean - min;

  // Calculate coefficient of variation (CV) for the duration values
  const cv = coefficientOfVariation(xs);

  // For individual runs, we use the same CV for all metrics since we only have duration data
  const meanVariation = cv;
  const medianVariation = cv;
  const p75Variation = cv;
  const p95Variation = cv;

  // Calculate relevance score based on:
  // 1. Coefficient of variation (higher = more variable)
  // 2. Absolute range relative to mean (higher = more significant differences)
  const relativeRange = maxDelta / mean;
  const relevanceScore = Math.min(100, cv * 50 + relativeRange * 50);
  // Consider significant if:
  // - CV > 15% (individual runs can be more variable than aggregated stats)
  // - OR max delta > 1000ms (significant absolute difference)
  // - OR relative range > 30% (large spread relative to mean)
  const isSignificant = cv > 0.15 || maxDelta > 1000 || relativeRange > 0.3;

  return {
    meanVariation: Math.round(meanVariation * 100) / 100,
    medianVariation: Math.round(medianVariation * 100) / 100,
    p75Variation: Math.round(p75Variation * 100) / 100,
    p95Variation: Math.round(p95Variation * 100) / 100,
    maxDelta: Math.round(maxDelta),
    minDelta: Math.round(minDelta),
    relevanceScore: Math.round(relevanceScore * 100) / 100,
    isSignificant,
  };
}

/**
 * Calculate coefficient of variation (standard deviation / mean)
 *
 * @param values
 * Array of values to calculate CV for
 *
 * @returns
 * Coefficient of variation as a decimal (0.1 = 10%)
 */
export function coefficientOfVariation(xs: number[]): number {
  if (xs.length === 0) return 0;

  const m = mean(xs);
  if (m === 0) return 0;
  const stdDev = standardDeviation(xs);
  return stdDev / m;
}

/**
 * Calculate the standard deviation of a list of values
 *
 * @param xs
 * The list of values to calculate the standard deviation of
 *
 * @returns
 * The standard deviation of the list of values
 */
export function standardDeviation(xs: number[]): number {
  if (xs.length === 0) return 0;

  const m = mean(xs);
  const v = xs.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / xs.length;
  return Math.sqrt(v);
}

/**
 * Calculate the mean of a list of values
 *
 * @param xs
 * The list of values to calculate the mean of
 *
 * @returns
 * The mean of the list of values
 */
export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((sum, x) => sum + x, 0) / xs.length;
}
