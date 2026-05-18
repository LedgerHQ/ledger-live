import type BigNumber from "bignumber.js";

import type { Quote, QuoteSortBy } from "../types";
import { buildNetCounterValue, type NetCounterValueContext } from "./buildNetCounterValue";

type RankedQuote = {
  quote: Quote;
  netCounterValue: BigNumber;
};

export type SortQuotesContext = NetCounterValueContext & {
  sortBy?: QuoteSortBy;
};

function rankQuotes(quotes: Quote[], context: NetCounterValueContext): RankedQuote[] {
  return quotes.map(quote => ({
    quote,
    netCounterValue: buildNetCounterValue(quote, context),
  }));
}

export function sortQuotes(quotes: Quote[], context: SortQuotesContext): Quote[] {
  const sortBy = context.sortBy ?? "netCounterValue";

  if (sortBy !== "netCounterValue") {
    return quotes;
  }

  return rankQuotes(quotes, context)
    .sort((a, b) => b.netCounterValue.comparedTo(a.netCounterValue) || 0)
    .map(({ quote }) => quote);
}
