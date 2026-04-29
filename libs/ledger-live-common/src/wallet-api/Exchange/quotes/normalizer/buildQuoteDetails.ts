import type { RawQuote } from "../service/types";
import type { Quote } from "../types";
import { buildNetworkFees, buildPayoutNetworkFees } from "./networkFees";
import { buildPermitData } from "./permitData";
import { computeLiquiditySource, normalizeSlippage } from "./quoteHelpers";
import { buildTags } from "./tags";
import { buildTokenAllowance } from "./tokenAllowance";

export function buildQuoteDetails(quote: RawQuote, gasLess: boolean): Quote["quoteDetails"] {
  const details: Quote["quoteDetails"] = {
    type: quote.type,
    sendAmount: quote.amountFrom ?? 0,
    receiveAmount: quote.amountTo,
    gasLess,
    networkFees: buildNetworkFees(quote),
    slippage: normalizeSlippage(quote.slippage),
    exchangeRate: quote.exchangeRate,
    liquiditySource: computeLiquiditySource(quote),
  };

  const payoutNetworkFees = buildPayoutNetworkFees(quote);
  if (payoutNetworkFees !== undefined) {
    details.payoutNetworkFees = payoutNetworkFees;
  }

  const tokenAllowance = buildTokenAllowance(quote);
  if (tokenAllowance !== undefined) {
    details.tokenAllowance = tokenAllowance;
  }

  details.tags = buildTags(quote);

  const permitData = buildPermitData(quote);
  if (permitData !== undefined) {
    details.permitData = permitData;
  }

  return details;
}
