import BigNumber from "bignumber.js";

import type { RawQuote } from "../service/types";
import { QuoteWarningCodes, type QuoteWarning } from "../types";
import { normalizedProviderId } from "./quoteHelpers";
import { computeUnrealisticQuote } from "./unrealisticQuote";

export type NormalizationContext = {
  sendCurrencyId: string;
  receiveCurrencyId: string;
  sendParentCurrencyId?: string;
  receiveParentCurrencyId?: string;
  deviceModelId?: string;
  highValueLossThreshold?: number;
  spotPrices: Record<string, number>;
};

const NANO_S_MODEL_ID = "nanoS";

const NANO_S_INCOMPATIBLE_PROVIDERS = new Set([
  "thorswap",
  "uniswap",
  "lifi",
  "oneinch",
  "oneinchfusion",
  "velora",
  "okx",
]);

function addHighValueLossWarning(
  warnings: QuoteWarning[],
  quote: RawQuote,
  context: NormalizationContext,
): void {
  if (context.highValueLossThreshold == null) {
    return;
  }
  if (!Number.isFinite(context.highValueLossThreshold)) {
    return;
  }

  const fromSpotPrice = context.spotPrices[context.sendCurrencyId];
  const toSpotPrice = context.spotPrices[context.receiveCurrencyId];
  if (!fromSpotPrice || !toSpotPrice || quote.amountFrom == null) {
    return;
  }

  const amountFromCounterValue = new BigNumber(quote.amountFrom).multipliedBy(fromSpotPrice);
  const amountToCounterValue = new BigNumber(quote.amountTo).multipliedBy(toSpotPrice);

  if (amountFromCounterValue.isZero() || amountFromCounterValue.isNaN()) {
    return;
  }

  const lossPercent = new BigNumber(1)
    .minus(amountToCounterValue.dividedBy(amountFromCounterValue))
    .multipliedBy(100);

  if (!lossPercent.isGreaterThan(0)) {
    return;
  }

  const hasHighValueLoss = amountToCounterValue.isLessThanOrEqualTo(
    amountFromCounterValue.multipliedBy(context.highValueLossThreshold),
  );

  if (hasHighValueLoss) {
    const lossPercentNumber = lossPercent.toNumber();
    if (!Number.isFinite(lossPercentNumber)) {
      return;
    }

    warnings.push({
      code: QuoteWarningCodes.HIGH_VALUE_LOSS,
      lossPercent: lossPercentNumber,
    });
  }
}

function addNanoSIncompatibilityWarnings(
  warnings: QuoteWarning[],
  quote: RawQuote,
  context: NormalizationContext,
): void {
  if (context.deviceModelId !== NANO_S_MODEL_ID) {
    return;
  }

  const provider = normalizedProviderId(quote.provider);
  if (NANO_S_INCOMPATIBLE_PROVIDERS.has(provider)) {
    warnings.push({
      code: QuoteWarningCodes.NANO_S_PROVIDER_INCOMPATIBILITY,
      provider,
    });
  }
}

export function buildQuoteWarnings(quote: RawQuote, context: NormalizationContext): QuoteWarning[] {
  const warnings: QuoteWarning[] = [];

  addNanoSIncompatibilityWarnings(warnings, quote, context);
  addHighValueLossWarning(warnings, quote, context);

  if (context.spotPrices[context.receiveCurrencyId] === 0) {
    warnings.push({ code: QuoteWarningCodes.UNKNOWN_RECEIVE_FIAT_PRICE });
  }

  const unrealisticQuote = computeUnrealisticQuote(quote, context);
  if (unrealisticQuote) {
    warnings.push(unrealisticQuote);
  }

  return warnings;
}
