import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import { useCountervaluesState } from "@features/platform-market-countervalues";
import {
  alignFlatDayCountervalueChange,
  getCurrencyPortfolio,
  getCurrentBalanceCountervalueChange,
} from "@ledgerhq/live-common/portfolio/portfolio";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import type { AssetTableItem } from "./types";

/**
 * Computes the trend percentage for all asset items in a single pass,
 * with one shared subscription to countervalues state instead of N per cell.
 *
 * When the portfolio value change is unavailable (e.g. freshly-held positions whose 24h-ago
 * balance was zero), it falls back to the asset's price change computed locally from countervalues
 * on the current balance, so held assets show a variation instead of a placeholder.
 */
export function useAllCurrencyTrends(
  items: AssetTableItem[],
  range: PortfolioRange,
  marketDayChangeByCurrencyId?: ReadonlyMap<string, number>,
): Map<string, number | null> {
  const to = useSelector(counterValueCurrencySelector);
  const state = useCountervaluesState();

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
      const accounts = item.accounts as AccountLike[];
      const portfolio = getCurrencyPortfolio(accounts, range, state, to);
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
        getCurrentBalanceCountervalueChange(accounts, range, state, to).percentage ??
        null;
      map.set(item.currency.id, trend);
    }
    return map;
  }, [items, to, state, range, marketDayChangeByCurrencyId]);
}
