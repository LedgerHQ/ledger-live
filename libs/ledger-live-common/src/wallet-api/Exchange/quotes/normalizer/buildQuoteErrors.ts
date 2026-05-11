import { QuoteErrorCodes, type QuoteError } from "../types";
import type { FeeEstimate } from "./networkFeeEstimate";

export function buildQuoteErrors(feeEstimate?: FeeEstimate): QuoteError[] {
  const errors: QuoteError[] = [];

  if (feeEstimate?.notEnoughBalance) {
    errors.push({ code: QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES });
  }

  return errors;
}
