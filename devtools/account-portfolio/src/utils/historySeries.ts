import type { PortfolioHistoryPointView } from "../types";

export interface HistoryChartPoint {
  readonly time: number;
  /** Worth of everything held at `time`, in the requested currency. */
  readonly fiat: number;
}

/**
 * The vertical scale of the chart. A flat series still gets a span of 1, and the labels are taken
 * from that same span, so a constant line sits on its own value rather than one unit below it.
 */
export function historyChartScale(values: readonly number[], lines: number) {
  const minValue = Math.min(...values);
  const valueSpan = Math.max(...values) - minValue || 1;
  const labels = Array.from(
    { length: lines },
    (_, index) => minValue + (valueSpan * (lines - 1 - index)) / (lines - 1),
  );
  return { minValue, valueSpan, labels };
}

/**
 * Adds up the worth of every asset of every account, one point per instant the service reported.
 * An asset the service did not report at an instant keeps its last known worth, so the total does
 * not dip when the series are not sampled on the same instants. Points without a value are left
 * out: there is nothing to draw them with.
 */
export function historyChartPoints(
  points: readonly PortfolioHistoryPointView[],
): HistoryChartPoint[] {
  const valued = points
    .filter(point => point.currencyValue !== undefined && !Number.isNaN(Date.parse(point.time)))
    .map(point => ({
      key: `${point.accountId}:${point.asset}`,
      time: Date.parse(point.time),
      fiat: point.currencyValue ?? 0,
    }))
    .sort((a, b) => a.time - b.time);

  const last = new Map<string, number>();
  const chart: HistoryChartPoint[] = [];
  for (const [index, point] of valued.entries()) {
    last.set(point.key, point.fiat);
    if (valued[index + 1]?.time === point.time) continue;
    const fiat = [...last.values()].reduce((sum, value) => sum + value, 0);
    chart.push({ time: point.time, fiat });
  }
  return chart;
}
