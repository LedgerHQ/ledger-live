import BigNumber from "bignumber.js";

import type { FormattedQuoteValues } from "@ledgerhq/wallet-api-exchange-module";

import { formatQuote } from "../format/formatQuote";
import type { FormatContext } from "../format/types";
import type { Quote } from "../types";
import type { FeeEstimate } from "./networkFeeEstimate";

/**
 * Convert the base swap-gas estimate from atomic to display units.
 * Mirrors swap-live-app's `calculateNetworkFeeAmount`: only
 * `estimatedNetworkFee` contributes — the UI renders approvals on a
 * separate line — and returns `0` when the quote is gasless or the
 * wallet could not produce an estimate (parity with the legacy
 * `"0 <fee-ticker>"` display).
 *
 * @param feeEstimate - Wallet-side fee estimate, possibly undefined when
 *   no bridge was available.
 * @param feeCurrencyDecimals - Magnitude of the fee currency, used to
 *   scale the atomic amount.
 * @returns Fee amount in display units as a `BigNumber`.
 */
function estimatedNetworkFeeAsDisplay(
  feeEstimate: FeeEstimate | undefined,
  feeCurrencyDecimals: number | undefined,
): BigNumber {
  const atomic = feeEstimate?.estimatedNetworkFee?.amount;
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
 * @param feeEstimate - Wallet-side fee estimate; `undefined` collapses
 *   `networkFee` to `"0 <feeTicker>"`.
 * @param formatContext - Resolved locale / fiat / currencies + spot
 *   prices threaded down from the handler context.
 * @returns The triplet-shaped `FormattedQuoteValues` object to attach as
 *   `Quote.formatted`.
 */
export function buildFormattedQuoteValues(
  quoteDetails: Quote["quoteDetails"],
  feeEstimate: FeeEstimate | undefined,
  formatContext: FormatContext,
): FormattedQuoteValues {
  const networkFeeAmount = estimatedNetworkFeeAsDisplay(
    feeEstimate,
    formatContext.networkFeesCurrency?.decimals,
  );

  return formatQuote({
    quote: {
      type: quoteDetails.type,
      sendAmount: quoteDetails.sendAmount,
      receiveAmount: quoteDetails.receiveAmount,
      exchangeRate: quoteDetails.exchangeRate,
      slippage: quoteDetails.slippage,
      networkFeesCurrencyId: quoteDetails.networkFees.currencyId,
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
