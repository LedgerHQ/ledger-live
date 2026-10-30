import type { AssetTrendRange } from "./types";

type CountervalueChange = {
  readonly percentage?: number | null;
  readonly value: number;
};

function getFiatPriceVariationFromPercentChange(
  price?: number,
  dayPercentage?: number | null,
): number | undefined {
  if (price == null || dayPercentage == null) return undefined;
  const denominator = 1 + dayPercentage / 100;
  if (denominator === 0) return undefined;
  const previousPrice = price / denominator;
  const variation = price - previousPrice;
  if (Number.isNaN(variation)) return undefined;
  return variation;
}

export function alignFlatDayCountervalueChange({
  range,
  countervalueChange,
  balanceAtRangeStart,
  balanceAtRangeEnd,
  currentCountervalue,
  marketDayChangePercentPoints,
}: {
  readonly range: AssetTrendRange;
  readonly countervalueChange: CountervalueChange;
  readonly balanceAtRangeStart: number;
  readonly balanceAtRangeEnd: number;
  readonly currentCountervalue: number | null | undefined;
  readonly marketDayChangePercentPoints: number | null | undefined;
}): CountervalueChange {
  if (
    range !== "day" ||
    balanceAtRangeStart !== balanceAtRangeEnd ||
    marketDayChangePercentPoints == null ||
    !Number.isFinite(marketDayChangePercentPoints)
  ) {
    return countervalueChange;
  }

  const value = getFiatPriceVariationFromPercentChange(
    currentCountervalue ?? undefined,
    marketDayChangePercentPoints,
  );
  if (value == null || !Number.isFinite(value)) return countervalueChange;

  return {
    percentage: marketDayChangePercentPoints / 100,
    value,
  };
}
