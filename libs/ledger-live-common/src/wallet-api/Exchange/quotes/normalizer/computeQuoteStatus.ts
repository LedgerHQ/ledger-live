import type { RawQuote } from "../service/types";
import type { QuoteError, QuoteWarning } from "../types";
import { computeUnrealisticQuote } from "./unrealisticQuote";

export type NormalizationContext = {
  sendCurrencyId: string;
  receiveCurrencyId: string;
  spotPrices: Record<string, number>;
};

export function computeWarning(
  quote: RawQuote,
  context: NormalizationContext,
): QuoteWarning | null {
  return computeUnrealisticQuote(quote, context);
}

export function computeError(_quote: RawQuote, _context: NormalizationContext): QuoteError | null {
  return null;
}
