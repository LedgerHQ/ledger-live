import type BigNumber from "bignumber.js";

import type { Quote, QuoteSortBy } from "../types";
import { buildNetCounterValue, type NetCounterValueContext } from "./buildNetCounterValue";

type RankedQuote = {
  quote: Quote;
  netCounterValue: BigNumber;
  index: number;
};

export type SortQuotesContext = NetCounterValueContext & {
  sortBy?: QuoteSortBy;
};

function rankQuotes(quotes: Quote[], context: NetCounterValueContext): RankedQuote[] {
  return quotes.map((quote, index) => ({
    quote,
    index,
    netCounterValue: buildNetCounterValue(quote, context),
  }));
}

// Total order: highest net countervalue first, NaN (uncomputable) last, ties
// broken by original index. Being a total order keeps the result deterministic
// across engines without relying on Array.sort stability.
function byNetCounterValueDesc(a: RankedQuote, b: RankedQuote): number {
  const aNaN = a.netCounterValue.isNaN();
  const bNaN = b.netCounterValue.isNaN();
  if (aNaN || bNaN) {
    if (aNaN && bNaN) return a.index - b.index;
    return aNaN ? 1 : -1;
  }
  return b.netCounterValue.comparedTo(a.netCounterValue) || a.index - b.index;
}

export function sortQuotes(quotes: Quote[], context: SortQuotesContext): Quote[] {
  const sortBy = context.sortBy ?? "netCounterValue";

  if (sortBy !== "netCounterValue") {
    return quotes;
  }

  return rankQuotes(quotes, context)
    .sort(byNetCounterValueDesc)
    .map(({ quote }) => quote);
}
