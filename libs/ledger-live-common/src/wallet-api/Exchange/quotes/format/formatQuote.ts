import BigNumber from "bignumber.js";

import type { FormattedNumber } from "@ledgerhq/wallet-api-exchange-module";

import { COUNTERVALUE_MAX_DECIMALS, DEFAULT_MAX_DECIMALS } from "./constants";
import { EMPTY_FORMATTED_NUMBER, toFormattedNumber } from "./toFormattedNumber";
import type { CurrencyMeta, FiatMeta, FormatQuoteInput, FormattedQuoteValues } from "./types";

const NBSP = "\u00A0";

/**
 * Cap crypto display decimals at the historical swap-live-app app-config
 * default. Mirrors `useGetDefaultMaxDecimals`.
 *
 * @param decimals - Native magnitude of the currency (e.g. 18 for ETH).
 * @returns The decimal cap to pass to the number formatter, bounded above
 *   by {@link DEFAULT_MAX_DECIMALS}; falls back to `DEFAULT_MAX_DECIMALS`
 *   when the magnitude is unknown.
 */
function capCryptoDecimals(decimals: number | undefined): number {
  return Math.min(DEFAULT_MAX_DECIMALS, decimals ?? DEFAULT_MAX_DECIMALS);
}

/**
 * Format a crypto amount (display units) as a {@link FormattedNumber}
 * triplet. The currency ticker is attached on both sides with a
 * non-breaking space so consumers can pick the variant that matches
 * their layout: `"<ticker>\u00A0<value>"` (`withPrefix`) or
 * `"<value>\u00A0<ticker>"` (`withSuffix`). Missing currency metadata
 * collapses all three fields to the bare number.
 *
 * @param value - Amount in display units.
 * @param currency - Source-of-truth for ticker + decimal cap; when
 *   missing falls back to {@link DEFAULT_MAX_DECIMALS} and an empty
 *   ticker (all three triplet fields collapse to the bare number).
 * @param locale - BCP 47 tag for thousands / decimal separators.
 * @returns Triplet ready to attach to `Quote.formatted`.
 */
function formatCryptoNumber(
  value: BigNumber | number | string,
  currency: CurrencyMeta | undefined,
  locale: string,
): FormattedNumber {
  return toFormattedNumber(value, {
    locale,
    numberOfDecimals: capCryptoDecimals(currency?.decimals),
    prefix: currency?.ticker,
    prefixSeparator: NBSP,
    suffix: currency?.ticker,
  });
}

/**
 * Format a crypto amount as a fiat countervalue using the provided spot
 * price. Produces a {@link FormattedNumber} with the fiat symbol glued
 * to both sides so consumers can render the layout they need:
 * `"$4,500"` (`withPrefix`) or `"4,500\u00A0$"` (`withSuffix`).
 *
 * @param cryptoValue - Display-unit crypto amount to convert.
 * @param currencyId - Currency id used to look up the spot price.
 * @param spotPrices - `currencyId → spot price` map sourced from the
 *   wallet's counter-value pipeline.
 * @param fiat - Counter-value fiat metadata (symbol + magnitude).
 * @param locale - BCP 47 tag for separators.
 * @returns The formatted triplet, or `null` when the spot price is
 *   missing / zero so callers can decide on a fallback (empty string for
 *   send / receive amounts, the raw `networkFee` triplet for fees).
 */
function formatCountervalueNumber(
  cryptoValue: BigNumber | number | string,
  currencyId: string,
  spotPrices: Record<string, number>,
  fiat: FiatMeta,
  locale: string,
): FormattedNumber | null {
  const spotPrice = spotPrices[currencyId];
  if (!spotPrice) {
    return null;
  }

  const fiatValue = new BigNumber(cryptoValue).multipliedBy(spotPrice);

  return toFormattedNumber(fiatValue, {
    locale,
    prefix: fiat.symbol,
    suffix: fiat.symbol,
    numberOfDecimals: Math.min(COUNTERVALUE_MAX_DECIMALS, fiat.magnitude),
  });
}

/**
 * Format the exchange rate as a single full string — `"1 <from> =
 * <value> <to>"` — and publish the same string across all three triplet
 * fields. Rate is the only quote field that needs both a send-side
 * prefix and a receive-side suffix at once, so we collapse the
 * `numberValue` / `withPrefix` / `withSuffix` variants to the full form
 * for now; richer per-variant splits can be added later if a consumer
 * actually needs them.
 *
 * Falls back gracefully when ticker metadata is missing (e.g.
 * `sendCurrency` undefined collapses the prefix, `receiveCurrency`
 * undefined collapses the suffix).
 *
 * @param rate - Exchange rate (receive per one send unit, display units).
 * @param sendCurrency - Used for the `"1 <ticker> = "` prefix.
 * @param receiveCurrency - Used for the ticker suffix + decimal cap.
 * @param locale - BCP 47 tag for separators.
 * @returns Triplet whose three fields all carry the full rate string.
 */
function formatRateNumber(
  rate: BigNumber | number | string,
  sendCurrency: CurrencyMeta | undefined,
  receiveCurrency: CurrencyMeta | undefined,
  locale: string,
): FormattedNumber {
  const base = toFormattedNumber(rate, {
    locale,
    numberOfDecimals: capCryptoDecimals(receiveCurrency?.decimals),
    suffix: receiveCurrency?.ticker,
  });
  if (base.numberValue === "") {
    return base;
  }
  const full = sendCurrency?.ticker
    ? `1 ${sendCurrency.ticker} = ${base.withSuffix}`
    : base.withSuffix;
  return { numberValue: full, withPrefix: full, withSuffix: full };
}

/**
 * Format the slippage percentage triplet. Matches the legacy display
 * rule: integer values render as `"0%"` / `"1%"`, non-integers are
 * rounded to one decimal place (`"0.5%"`). The `%` suffix sits flush
 * against the number (no NBSP separator).
 *
 * @param slippage - Raw slippage value from the aggregator.
 * @param locale - BCP 47 tag for separators.
 * @returns Triplet for `Quote.formatted.slippage`.
 */
function formatSlippageNumber(slippage: number, locale: string): FormattedNumber {
  const normalized = Number.isSafeInteger(slippage) ? slippage : parseFloat(slippage.toFixed(1));
  return toFormattedNumber(normalized, {
    locale,
    suffix: "%",
    suffixSeparator: "",
  });
}

/**
 * Produce the ready-to-render {@link FormattedQuoteValues} for a single
 * quote. Pure function — all data must be supplied by the caller (the
 * `normalizeQuote` orchestrator resolves currencies, converts the atomic
 * fee estimate to display units, and threads locale / fiat / spot prices
 * down from the server handler context).
 *
 * Parity contract with swap-live-app's `useFormattedValues`:
 * - missing crypto currency metadata falls back to
 *   {@link DEFAULT_MAX_DECIMALS} decimals and empty ticker,
 * - missing spot price collapses the corresponding countervalue triplet
 *   to all-empty, except `networkFeeCountervalue` which reuses the
 *   `networkFee` triplet.
 *
 * The `~` "approximate" marker that legacy consumers show for float
 * quotes is NOT applied here — `quote.type` is surfaced as-is so each
 * consumer can decorate the value to fit its own layout.
 *
 * @param input - Inputs collected by the normalizer.
 * @returns The eight-field {@link FormattedQuoteValues} object attached
 *   to `Quote.formatted`.
 */
export function formatQuote(input: FormatQuoteInput): FormattedQuoteValues {
  const {
    quote,
    networkFeeAmount,
    sendCurrency,
    receiveCurrency,
    networkFeesCurrency,
    fiat,
    spotPrices,
    locale,
  } = input;

  const sendAmount = formatCryptoNumber(quote.sendAmount, sendCurrency, locale);

  const receiveAmount = formatCryptoNumber(quote.receiveAmount, receiveCurrency, locale);

  const networkFee = formatCryptoNumber(networkFeeAmount, networkFeesCurrency, locale);

  const rate = formatRateNumber(quote.exchangeRate, sendCurrency, receiveCurrency, locale);

  const sendAmountCountervalue = sendCurrency?.id
    ? formatCountervalueNumber(quote.sendAmount, sendCurrency.id, spotPrices, fiat, locale) ??
      EMPTY_FORMATTED_NUMBER
    : EMPTY_FORMATTED_NUMBER;

  const receiveAmountCountervalue = receiveCurrency?.id
    ? formatCountervalueNumber(quote.receiveAmount, receiveCurrency.id, spotPrices, fiat, locale) ??
      EMPTY_FORMATTED_NUMBER
    : EMPTY_FORMATTED_NUMBER;

  const feeCountervalueCurrencyId = quote.networkFeesCurrencyId || networkFeesCurrency?.id || "";
  const networkFeeCountervalue =
    formatCountervalueNumber(
      networkFeeAmount,
      feeCountervalueCurrencyId,
      spotPrices,
      fiat,
      locale,
    ) ?? networkFee;

  const slippage = formatSlippageNumber(quote.slippage, locale);

  return {
    sendAmount,
    sendAmountCountervalue,
    receiveAmount,
    receiveAmountCountervalue,
    networkFee,
    networkFeeCountervalue,
    rate,
    slippage,
  };
}
