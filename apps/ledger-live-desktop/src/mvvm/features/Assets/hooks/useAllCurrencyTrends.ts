import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { getCurrencyPortfolio } from "@ledgerhq/live-countervalues/portfolio";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import type { AssetTableItem } from "../types";

/**
 * Computes the trend percentage for all asset items in a single pass,
 * with one shared subscription to countervalues state instead of N per cell.
 */
export function useAllCurrencyTrends(
  items: AssetTableItem[],
  range: PortfolioRange,
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
      const portfolio = getCurrencyPortfolio(item.accounts as AccountLike[], range, state, to);
      map.set(item.currency.id, portfolio.countervalueChange.percentage ?? null);
    }
    return map;
  }, [items, to, state, range]);
}
