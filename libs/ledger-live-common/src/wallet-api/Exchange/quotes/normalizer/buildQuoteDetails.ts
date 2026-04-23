import type { RawQuote } from "../service/types";
import type { Quote } from "../types";

export function buildQuoteDetails(quote: RawQuote, gasLess: boolean): Quote["quoteDetails"] {
  const raw = quote.networkFees;
  const networkFees: Quote["quoteDetails"]["networkFees"] = {
    currencyId: raw.currency,
  };
  if (raw.gasLimit !== undefined && raw.gasLimit !== "") {
    networkFees.gasLimit = raw.gasLimit;
  }

  return {
    type: quote.type,
    sendAmount: quote.amountFrom ?? 0,
    receiveAmount: quote.amountTo,
    gasLess,
    networkFees,
    slippage: quote.slippage,
    exchangeRate: quote.exchangeRate,
  };
}
