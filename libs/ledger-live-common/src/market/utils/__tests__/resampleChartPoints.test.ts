import { resampleChartPointsByInterval } from "../resampleChartPoints";
import { ChartDataPoint } from "../types";

const HOUR = 3_600_000;

/** Builds a series of `count` points spaced `stepMs` apart, value = index. */
function series(count: number, stepMs: number, startTs = 0): ChartDataPoint[] {
  return Array.from({ length: count }, (_, i) => [startTs + i * stepMs, i] as ChartDataPoint);
}

describe("resampleChartPointsByInterval", () => {
  it("returns a copy unchanged for series of 2 points or fewer", () => {
    const points = series(2, HOUR);
    const result = resampleChartPointsByInterval(points, HOUR);
    expect(result).toEqual(points);
    expect(result).not.toBe(points);
  });

  it("returns the series unchanged for non-positive or non-finite intervals", () => {
    const points = series(10, HOUR);
    expect(resampleChartPointsByInterval(points, 0)).toEqual(points);
    expect(resampleChartPointsByInterval(points, -1)).toEqual(points);
    expect(resampleChartPointsByInterval(points, NaN)).toEqual(points);
  });

  it("does not upsample when source spacing is already wider than the target", () => {
    // Daily points asked for an hourly target: every point clears the interval.
    const daily = series(10, 24 * HOUR);
    expect(resampleChartPointsByInterval(daily, HOUR)).toEqual(daily);
  });

  it("coarsens an hourly series to roughly one point per target interval", () => {
    const hourly = series(49, HOUR);
    const result = resampleChartPointsByInterval(hourly, 6 * HOUR);
    const spacings = result.slice(1).map((p, i) => p[0] - result[i][0]);
    expect(Math.min(...spacings)).toBeGreaterThanOrEqual(6 * HOUR);
    expect(result.length).toBeLessThan(hourly.length);
  });

  it("always keeps the first and last points", () => {
    const hourly = series(49, HOUR);
    const result = resampleChartPointsByInterval(hourly, 6 * HOUR);
    expect(result[0]).toEqual(hourly[0]);
    expect(result[result.length - 1]).toEqual(hourly[hourly.length - 1]);
  });

  it("preserves the global min and max points", () => {
    // Spike a min and a max at indices that the even-interval walk would skip.
    const points = series(49, HOUR);
    points[5] = [points[5][0], 999]; // global max
    points[7] = [points[7][0], -999]; // global min
    const result = resampleChartPointsByInterval(points, 6 * HOUR);
    expect(result).toContainEqual(points[5]);
    expect(result).toContainEqual(points[7]);
  });

  it("keeps points sorted ascending by timestamp", () => {
    const points = series(49, HOUR);
    points[5] = [points[5][0], 999];
    points[7] = [points[7][0], -999];
    const result = resampleChartPointsByInterval(points, 6 * HOUR);
    const timestamps = result.map(p => p[0]);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it("does not mutate the input series", () => {
    const points = series(10, HOUR);
    const snapshot = points.map(p => [...p]);
    resampleChartPointsByInterval(points, 2 * HOUR);
    expect(points).toEqual(snapshot);
  });

  /** Series of `count` points ~`stepMs` apart with ±`jitterMs` timestamp noise. */
  function jittered(count: number, stepMs: number, jitterMs: number): ChartDataPoint[] {
    let ts = 0;
    return Array.from({ length: count }, (_, i) => {
      const point: ChartDataPoint = [ts, i];
      ts += stepMs + (i % 2 === 0 ? jitterMs : -jitterMs);
      return point;
    });
  }

  it("keeps every point when the target matches the native spacing, despite jitter", () => {
    // Regression (LIVE-31777): a 5min target on jittery ~5min data must not
    // alternate 5min/10min gaps.
    const fiveMin = 5 * 60_000;
    const points = jittered(50, fiveMin, 8_000);
    expect(resampleChartPointsByInterval(points, fiveMin)).toEqual(points);
  });

  it("produces a constant stride on exact multiples, despite jitter", () => {
    const fiveMin = 5 * 60_000;
    const points = jittered(51, fiveMin, 8_000);
    const result = resampleChartPointsByInterval(points, 2 * fiveMin);
    expect(result.map(p => p[1])).toEqual(points.filter((_, i) => i % 2 === 0).map(p => p[1]));
  });
});
