import BigNumber from "bignumber.js";

import type { RawQuote } from "../service/types";
import { QuoteWarningCodes, type QuoteWarning } from "../types";

export function computeUnrealisticQuote(
  quote: RawQuote,
  context: {
    sendCurrencyId: string;
    receiveCurrencyId: string;
    spotPrices: Record<string, number>;
  },
): QuoteWarning | null {
  const fromSpot = context.spotPrices[context.sendCurrencyId];
  const toSpot = context.spotPrices[context.receiveCurrencyId];
  const amountFrom = quote.amountFrom;

  if (amountFrom == null || amountFrom === 0 || !fromSpot || !toSpot) {
    return null;
  }

  const amountFromFiat = BigNumber(amountFrom).multipliedBy(fromSpot);
  const amountToFiat = BigNumber(quote.amountTo).multipliedBy(toSpot);

  if (amountFromFiat.isZero() || amountFromFiat.isNaN()) {
    return null;
  }

  const gainPercent = amountToFiat.dividedBy(amountFromFiat).minus(1).multipliedBy(100);

  if (!gainPercent.isGreaterThan(0)) {
    return null;
  }

  // Extreme spot-price ratios can push gainPercent above Number.MAX_VALUE; the
  // resulting Infinity serializes to null over JSON and breaks the numeric contract.
  const gainPercentNumber = gainPercent.toNumber();
  if (!Number.isFinite(gainPercentNumber)) {
    return null;
  }

  return { code: QuoteWarningCodes.UNREALISTIC_QUOTE, gainPercent: gainPercentNumber };
}
