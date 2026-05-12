import type { PnlCardIcon } from "../../../shared/components/types";
import type { TraderMultiVM } from "../useTraderViewModel";

/** Distinct asset icons in first-seen account order. */
export function uniqueIcons(multi: TraderMultiVM): PnlCardIcon[] {
  const seen = new Set<string>();
  const icons: PnlCardIcon[] = [];
  for (const a of multi.accounts) {
    if (seen.has(a.asset.currency.id)) continue;
    seen.add(a.asset.currency.id);
    icons.push({ ledgerId: a.asset.currency.id, ticker: a.ticker });
  }
  return icons;
}
