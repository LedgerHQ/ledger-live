import BigNumber from "bignumber.js";

import type { FormattedQuoteValues } from "@ledgerhq/wallet-api-exchange-module";

import { formatQuote } from "../format/formatQuote";
import type { FormatContext } from "../format/types";
import type { Quote } from "../types";

/**
 * Convert an atomic quote fee field to display units.
 */
function networkFeeAsDisplay(
  quoteDetails: Quote["quoteDetails"],
  feeCurrencyDecimals: number | undefined,
): BigNumber {
  const atomic = quoteDetails.totalNetworkFee?.amount;
  if (!atomic || feeCurrencyDecimals === undefined) {
    return new BigNumber(0);
  }
  return new BigNumber(atomic).shiftedBy(-feeCurrencyDecimals);
}

/**
 * Build the `FormattedQuoteValues` payload for a single quote. Bridges
 * the wire-shaped {@link Quote} to the pure {@link formatQuote} helper —
 * keeps the normalizer body linear by hiding atomic-to-display
 * conversion and field plumbing.
 *
 * @param quoteDetails - Already-normalized quote details carrying the
 *   numeric fields to format.
 * @param formatContext - Resolved locale / fiat / currencies + spot
 *   prices threaded down from the handler context.
 * @returns The triplet-shaped `FormattedQuoteValues` object to attach as
 *   `Quote.formatted`.
 */
export function buildFormattedQuoteValues(
  quoteDetails: Quote["quoteDetails"],
  formatContext: FormatContext,
): FormattedQuoteValues {
  const networkFeeAmount = networkFeeAsDisplay(
    quoteDetails,
    formatContext.networkFeesCurrency?.decimals,
  );

  return formatQuote({
    quote: {
      type: quoteDetails.type,
      sendAmount: quoteDetails.sendAmount,
      receiveAmount: quoteDetails.receiveAmount,
      exchangeRate: quoteDetails.exchangeRate,
      slippage: quoteDetails.slippage,
      networkFeesCurrencyId:
        quoteDetails.totalNetworkFee?.currencyId ?? quoteDetails.networkFees.currencyId,
    },
    networkFeeAmount,
    sendCurrency: formatContext.sendCurrency,
    receiveCurrency: formatContext.receiveCurrency,
    networkFeesCurrency: formatContext.networkFeesCurrency,
    fiat: formatContext.fiat,
    spotPrices: formatContext.spotPrices,
    locale: formatContext.locale,
  });
}
