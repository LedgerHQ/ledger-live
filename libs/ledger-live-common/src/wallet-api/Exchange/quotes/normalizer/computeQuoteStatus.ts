import type { RawQuote } from "../service/types";
import type { QuoteError, QuoteWarning } from "../types";

/** Above this ratio we flag `highSpread` (same order of magnitude as legacy swap checks). */
const HIGH_SPREAD_EXCHANGE_RATE_THRESHOLD = 1_000_000;

export function computeWarning(quote: RawQuote): QuoteWarning | null {
  if (quote.exchangeRate > HIGH_SPREAD_EXCHANGE_RATE_THRESHOLD) {
    return { code: "highSpread" };
  }
  return null;
}

export function computeError(_quote: RawQuote): QuoteError | null {
  return null;
}
