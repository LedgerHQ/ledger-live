import BigNumber from "bignumber.js";

import type { Quote, QuoteNetworkFeeAmount } from "../types";

export type NetCounterValueContext = {
  receiveCurrencyId: string;
  spotPrices: Record<string, number>;
  feeCurrencyMagnitude?: number;
};

function feeAmountAsDisplayValue(
  fee: QuoteNetworkFeeAmount | undefined,
  feeCurrencyMagnitude: number | undefined,
): BigNumber {
  if (!fee || feeCurrencyMagnitude === undefined) {
    return new BigNumber(0);
  }
  return new BigNumber(fee.amount).shiftedBy(-feeCurrencyMagnitude);
}

export function buildNetCounterValue(quote: Quote, context: NetCounterValueContext): BigNumber {
  // `??` not `||`: a 0 spot price means "price unknown" and must stay 0, not
  // collapse to 1 and sort on the raw receiveAmount.
  const receiveSpotPrice = context.spotPrices[context.receiveCurrencyId] ?? 1;
  const receiveCounterValue = new BigNumber(quote.quoteDetails.receiveAmount).times(
    receiveSpotPrice,
  );

  const networkFee = feeAmountAsDisplayValue(
    quote.quoteDetails.totalNetworkFee,
    context.feeCurrencyMagnitude,
  );
  const feeCurrencyId =
    quote.quoteDetails.totalNetworkFee?.currencyId ?? quote.quoteDetails.networkFees.currencyId;
  const feeSpotPrice = context.spotPrices[feeCurrencyId] || 0;
  const networkFeeCounterValue = networkFee.times(feeSpotPrice);

  return receiveCounterValue.minus(networkFeeCounterValue);
}
