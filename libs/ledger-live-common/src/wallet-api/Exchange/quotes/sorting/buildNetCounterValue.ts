import BigNumber from "bignumber.js";

import type { Quote, QuoteEstimatedNetworkFee } from "../types";

export type NetCounterValueContext = {
  receiveCurrencyId: string;
  spotPrices: Record<string, number>;
  feeCurrencyMagnitude?: number;
};

function feeAmountAsDisplayValue(
  fee: QuoteEstimatedNetworkFee | undefined,
  feeCurrencyMagnitude: number | undefined,
): BigNumber {
  if (!fee || feeCurrencyMagnitude === undefined) {
    return new BigNumber(0);
  }
  return new BigNumber(fee.amount).shiftedBy(-feeCurrencyMagnitude);
}

export function buildNetCounterValue(quote: Quote, context: NetCounterValueContext): BigNumber {
  const receiveSpotPrice = context.spotPrices[context.receiveCurrencyId] || 1;
  const receiveCounterValue = new BigNumber(quote.quoteDetails.receiveAmount).times(
    receiveSpotPrice,
  );

  const estimatedFee = feeAmountAsDisplayValue(
    quote.quoteDetails.estimatedNetworkFee,
    context.feeCurrencyMagnitude,
  );
  const approvalFee = feeAmountAsDisplayValue(
    quote.quoteDetails.approvalNetworkFee,
    context.feeCurrencyMagnitude,
  );
  const feeCurrencyId =
    quote.quoteDetails.estimatedNetworkFee?.currencyId ??
    quote.quoteDetails.approvalNetworkFee?.currencyId ??
    quote.quoteDetails.networkFees.currencyId;
  const feeSpotPrice = context.spotPrices[feeCurrencyId] || 0;
  const networkFeeCounterValue = estimatedFee.plus(approvalFee).times(feeSpotPrice);

  return receiveCounterValue.minus(networkFeeCounterValue);
}
