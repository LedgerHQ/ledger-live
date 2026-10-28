import type { AccountPortfolioView } from "../types";

/**
 * Balance entries from the most valuable to the least, in the requested currency. An entry the
 * service gave no value for goes last, in the order it came. The sort is stable.
 *
 * Operations keep the service's order, which is chronological: ordering them by value would lose
 * what a history is for.
 */
export function sortByFiat(view: AccountPortfolioView): AccountPortfolioView {
  if (view.kind !== "balance") return view;
  const entries = view.entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const left = a.entry.currencyValue;
      const right = b.entry.currencyValue;
      if (left === undefined && right === undefined) return a.index - b.index;
      if (left === undefined) return 1;
      if (right === undefined) return -1;
      return right - left || a.index - b.index;
    })
    .map(({ entry }) => entry);
  return { ...view, entries };
}
