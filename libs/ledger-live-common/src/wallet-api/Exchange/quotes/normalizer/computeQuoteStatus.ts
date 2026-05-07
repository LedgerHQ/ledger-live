import type { RawQuote } from "../service/types";
import type { QuoteError, QuoteWarning } from "../types";
import type { FeeEstimate } from "./networkFeeEstimate";
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

/** Emits `notEnoughBalanceForFees` when {@link FeeEstimate} flags it; `null` otherwise. */
export function computeError(_quote: RawQuote, feeEstimate?: FeeEstimate): QuoteError | null {
  if (feeEstimate?.notEnoughBalance) {
    return "notEnoughBalanceForFees";
  }
  return null;
}
