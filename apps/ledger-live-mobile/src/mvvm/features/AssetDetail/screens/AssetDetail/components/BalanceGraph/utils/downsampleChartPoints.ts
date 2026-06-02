/**
 * Target ceiling for the number of points fed to the SVG line chart. The market
 * API returns ~350 points for some ranges; rendering that many in an SVG path on
 * mobile is wasteful (well below 1 visible point per pixel) and noticeably janky.
 * ~120 keeps the curve visually identical while cutting the path/scrubber cost.
 */
export const MAX_SERIES_POINTS = 125;

type DownsampledPoints = Readonly<{ timestamps: number[]; values: number[] }>;

/**
 * Reduces a (timestamps, values) series to at most `maxPoints` while preserving:
 * - the first and last points (range bounds / % change),
 * - the global min and max points (amplitude + extrema markers),
 * - even spacing in between (overall shape).
 *
 * Timestamps and values are reduced together so downstream indices (scrubber,
 * x-axis ticks, transaction markers) stay aligned with the rendered line.
 */
export function downsampleChartPoints(
  timestamps: number[],
  values: number[],
  maxPoints: number = MAX_SERIES_POINTS,
): DownsampledPoints {
  const length = Math.min(timestamps.length, values.length);
  if (length <= maxPoints || maxPoints < 2) {
    return { timestamps, values };
  }

  let minIndex = 0;
  let maxIndex = 0;
  for (let i = 1; i < length; i++) {
    if (values[i] < values[minIndex]) minIndex = i;
    if (values[i] > values[maxIndex]) maxIndex = i;
  }

  const kept = new Set<number>([0, length - 1, minIndex, maxIndex]);
  for (let i = 0; i < maxPoints; i++) {
    kept.add(Math.round((i * (length - 1)) / (maxPoints - 1)));
  }

  const indices = Array.from(kept).sort((a, b) => a - b);
  return {
    timestamps: indices.map(i => timestamps[i]),
    values: indices.map(i => values[i]),
  };
}
