import type { ChartDataPoint } from "./types";

export function appendLatestPriceToChart(
  points: readonly ChartDataPoint[],
  latestPrice: number | undefined,
  now: number,
): ChartDataPoint[] {
  if (
    points.length === 0 ||
    latestPrice == null ||
    !Number.isFinite(latestPrice) ||
    latestPrice <= 0 ||
    !Number.isFinite(now)
  ) {
    return points.slice();
  }

  const lastTimestamp = points[points.length - 1][0];
  if (lastTimestamp >= now) {
    const next = points.slice();
    next[next.length - 1] = [lastTimestamp, latestPrice];
    return next;
  }

  return [...points, [now, latestPrice]];
}
