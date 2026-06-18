/** Ranges whose %/fiat variation is derived from rendered chart endpoints (no market-API key). */
const CHART_DERIVED_PRICE_CHANGE_RANGES = new Set<string>(["all"]);

export function isChartDerivedPriceChangeRange(range: string): boolean {
  return CHART_DERIVED_PRICE_CHANGE_RANGES.has(range);
}

export function getChartRangeVariation(
  prices: readonly number[],
): { percentage: number; variationFiat: number } | undefined {
  if (prices.length < 2) return undefined;
  const first = prices[0];
  const last = prices.at(-1);
  if (first == null || last == null || !Number.isFinite(first) || !Number.isFinite(last)) {
    return undefined;
  }
  const variationFiat = last - first;
  const percentage = first === 0 ? 0 : (variationFiat / first) * 100;
  return { percentage, variationFiat };
}

/** Percent points between the first and last chart prices (e.g. 50 = +50%). */
export function computeChartRangeChangePercentage(prices: readonly number[]): number | undefined {
  return getChartRangeVariation(prices)?.percentage;
}
