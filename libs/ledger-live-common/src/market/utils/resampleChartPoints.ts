import { ChartDataPoint } from "./types";

function medianSpacing(points: readonly ChartDataPoint[]): number {
  const deltas: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const delta = points[i][0] - points[i - 1][0];
    if (delta > 0) deltas.push(delta);
  }
  if (deltas.length === 0) return 0;
  deltas.sort((a, b) => a - b);
  const mid = deltas.length >> 1;
  return deltas.length % 2 === 0 ? (deltas[mid - 1] + deltas[mid]) / 2 : deltas[mid];
}

/**
 * Coarsens a price series toward one point per `targetIntervalMs`, preserving
 * first/last and global min/max. Uses an integer stride from the median native
 * spacing so the result stays constant under timestamp jitter, and only ever
 * coarsens — a target finer than the data returns it at native resolution.
 */
export function resampleChartPointsByInterval(
  points: readonly ChartDataPoint[],
  targetIntervalMs: number,
): ChartDataPoint[] {
  const length = points.length;
  if (length <= 2 || !Number.isFinite(targetIntervalMs) || targetIntervalMs <= 0) {
    return points.slice();
  }

  const median = medianSpacing(points);
  const stride = median > 0 ? Math.max(1, Math.round(targetIntervalMs / median)) : 1;
  if (stride === 1) return points.slice();

  let minIndex = 0;
  let maxIndex = 0;
  for (let i = 1; i < length; i++) {
    if (points[i][1] < points[minIndex][1]) minIndex = i;
    if (points[i][1] > points[maxIndex][1]) maxIndex = i;
  }

  const kept = new Set<number>([0, length - 1, minIndex, maxIndex]);
  for (let i = 0; i < length; i += stride) kept.add(i);

  return Array.from(kept)
    .sort((a, b) => a - b)
    .map(i => points[i]);
}
