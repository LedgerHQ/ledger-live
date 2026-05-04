import type { RawQuote } from "../service/types";
import type { Quote } from "../types";
import type { FeeEstimate } from "./networkFeeEstimate";
import { buildNetworkFees, buildPayoutNetworkFees } from "./networkFees";
import { buildPermitData } from "./permitData";
import { computeLiquiditySource, normalizeSlippage } from "./quoteHelpers";
import { buildTags } from "./tags";
import { buildTokenAllowance } from "./tokenAllowance";

export function buildQuoteDetails(
  quote: RawQuote,
  gasLess: boolean,
  feeEstimate?: FeeEstimate,
): Quote["quoteDetails"] {
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

  if (feeEstimate?.estimatedNetworkFee) {
    details.estimatedNetworkFee = feeEstimate.estimatedNetworkFee;
  }
  if (feeEstimate?.approvalNetworkFee) {
    details.approvalNetworkFee = feeEstimate.approvalNetworkFee;
  }

  return details;
}
