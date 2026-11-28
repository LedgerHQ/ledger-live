// The statistics of the analysis, on plain numbers: medians, the Hodges–Lehmann estimate with its
// Wilcoxon interval, a seeded bootstrap of the mean, and the widening that uneven phases need.

/** An estimate of B − A with its 95% interval; no interval below six differences. */
export interface Interval {
  estimate: number;
  low: number | null;
  high: number | null;
}

/** An interval that has both bounds. */
export interface ClosedInterval {
  estimate: number;
  low: number;
  high: number;
}

const Z_95 = 1.959964;

const middleOfSorted = (sorted: number[]): number => {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function median(values: number[]): number | null {
  if (!values.length) return null;
  return middleOfSorted([...values].sort((a, b) => a - b));
}

// Median absolute deviation scaled to a normal SD.
export function robustSd(values: number[]): number | null {
  const m = median(values);
  if (m === null) return null;
  const deviation = median(values.map(v => Math.abs(v - m)));
  return deviation === null ? null : 1.4826 * deviation;
}

// Normal-approximation Wilcoxon interval (Hollander & Wolfe): C-th smallest and largest Walsh averages.
export function hodgesLehmann(diffs: number[]): Interval | null {
  const n = diffs.length;
  if (!n) return null;
  const walsh: number[] = [];
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) walsh.push((diffs[i] + diffs[j]) / 2);
  walsh.sort((a, b) => a - b);
  const estimate = middleOfSorted(walsh);
  if (n < 6) return { estimate, low: null, high: null };
  const k = (n * (n + 1)) / 4 - Z_95 * Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const c = Math.max(1, Math.floor(k + 0.5));
  return { estimate, low: walsh[c - 1], high: walsh[walsh.length - c] };
}

/** `hl` when it has both bounds, else null (fewer than six differences). */
export function closed(hl: Interval | null): ClosedInterval | null {
  const low = hl?.low ?? null;
  const high = hl?.high ?? null;
  return hl === null || low === null || high === null ? null : { estimate: hl.estimate, low, high };
}

// The true B − A the gate flags 80% of the time: the threshold plus 0.84 standard errors.
export function detectableAt80(hl: Interval | null, thresholdMs: number): number | null {
  const interval = closed(hl);
  return interval && thresholdMs + 0.8416 * ((interval.high - interval.low) / (2 * Z_95));
}

/** mulberry32: numbers in [0, 1), the same sequence for the same seed. */
export function seededRandom(seed: number): () => number {
  // The Int32Array wraps the state to 32 bits.
  const state = new Int32Array([seed]);
  return () => {
    state[0] += 0x6d2b79f5;
    const current = state[0];
    let t = Math.imul(current ^ (current >>> 15), 1 | current);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded, so the same samples always give the same interval.
export function bootstrapMean(diffs: number[], resamples = 4000): ClosedInterval | null {
  const n = diffs.length;
  if (n < 6) return null;
  const random = seededRandom(0x9e3779b9);
  const mean = (values: number[]) => values.reduce((a, v) => a + v, 0) / values.length;
  const means: number[] = [];
  for (let r = 0; r < resamples; r++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += diffs[Math.floor(random() * n)];
    means.push(sum / n);
  }
  means.sort((a, b) => a - b);
  return {
    estimate: mean(diffs),
    low: means[Math.floor(0.025 * resamples)],
    high: means[Math.ceil(0.975 * resamples) - 1],
  };
}

/**
 * How much wider the B − A interval is than the pooled pairs give: the device bias correction
 * averages the two phases, so uneven ones add uncertainty. 1 when both phases have as many pairs.
 */
export function unevenPhasesFactor(n0: number, n1: number): number {
  return Math.sqrt(((n0 + n1) / 4) * (1 / n0 + 1 / n1));
}

export const widen = <T extends Interval>(interval: T | null, factor: number): T | null =>
  factor !== 1 && interval && interval.low !== null && interval.high !== null
    ? {
        ...interval,
        low: interval.estimate - factor * (interval.estimate - interval.low),
        high: interval.estimate + factor * (interval.high - interval.estimate),
      }
    : interval;
