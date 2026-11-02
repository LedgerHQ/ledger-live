import { useMemo } from "react";
import { alignFlatDayCountervalueChange } from "./alignFlatDayCountervalueChange";
import { useAssetsTablePorts } from "./assetsTablePorts";
import type { AssetTableItem, AssetTrendRange } from "./types";

// A missing portfolio percentage falls back to the price move of the current balance, so a
// position opened inside the range still shows a variation.
export function useAllCurrencyTrends(
  items: readonly AssetTableItem[],
  range: AssetTrendRange,
  marketDayChangeByCurrencyId?: ReadonlyMap<string, number>,
): Map<string, number | null> {
  const { getCurrencyPortfolio, getCurrentBalanceCountervalueChange } = useAssetsTablePorts();

  return useMemo(() => {
    const map = new Map<string, number | null>();
    for (const item of items) {
      if (item.isPlaceholder || !item.accounts.length) {
        map.set(item.currency.id, null);
        continue;
      }
      if (item.value <= 0) {
        map.set(item.currency.id, 0);
        continue;
      }
      const portfolio = getCurrencyPortfolio(item.accounts, range);
      const balanceAtRangeStart = portfolio.history[0]?.value;
      const balanceAtRangeEnd = portfolio.history.at(-1)?.value;
      const countervalueChange =
        balanceAtRangeStart == null || balanceAtRangeEnd == null
          ? portfolio.countervalueChange
          : alignFlatDayCountervalueChange({
              range,
              countervalueChange: portfolio.countervalueChange,
              balanceAtRangeStart,
              balanceAtRangeEnd,
              currentCountervalue: portfolio.history.at(-1)?.countervalue,
              marketDayChangePercentPoints: marketDayChangeByCurrencyId?.get(item.currency.id),
            });
      const trend =
        countervalueChange.percentage ??
        getCurrentBalanceCountervalueChange(item.accounts, range).percentage ??
        null;
      map.set(item.currency.id, trend);
    }
    return map;
  }, [
    items,
    range,
    marketDayChangeByCurrencyId,
    getCurrencyPortfolio,
    getCurrentBalanceCountervalueChange,
  ]);
}
