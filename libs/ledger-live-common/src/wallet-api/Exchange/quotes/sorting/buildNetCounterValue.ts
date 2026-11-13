import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";

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
  return parseFiniteBigNumber(fee.amount)?.shiftedBy(-feeCurrencyMagnitude) ?? new BigNumber(0);
}

export function buildNetCounterValue(quote: Quote, context: NetCounterValueContext): BigNumber {
  // `??` not `||`: a 0 spot price means "price unknown" and must stay 0, not
  // collapse to 1 and sort on the raw receiveAmount.
  const receiveSpotPrice = context.spotPrices[context.receiveCurrencyId] ?? 1;
  const receiveAmount = parseFiniteBigNumber(quote.quoteDetails.receiveAmount) ?? new BigNumber(0);
  const receiveCounterValue = receiveAmount.times(receiveSpotPrice);

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
