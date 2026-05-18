import type BigNumber from "bignumber.js";

import type { FormattedNumber } from "@ledgerhq/wallet-api-exchange-module";

import { getFormattedNumber } from "./getFormattedNumber";

/**
 * Default separator inserted between the number and its suffix. Mirrors
 * swap-live-app's `getFormattedNumber` behavior (non-breaking space to
 * keep the ticker glued to the value when the line wraps). Overridable
 * via {@link ToFormattedNumberOptions.suffixSeparator} for suffixes that
 * should sit flush against the number (e.g. `%`).
 */
const DEFAULT_SUFFIX_SEPARATOR = "\u00A0";

const EMPTY: FormattedNumber = { numberValue: "", withPrefix: "", withSuffix: "" };

export type ToFormattedNumberOptions = {
  /** BCP 47 locale tag forwarded to {@link getFormattedNumber}. */
  locale: string;
  /** Maximum decimal places. See {@link getFormattedNumber}. */
  numberOfDecimals?: number;
  /** Text glued to the left of `numberValue` to build `withPrefix`. */
  prefix?: string;
  /** Text glued to the right of `numberValue` to build `withSuffix`. */
  suffix?: string;
  /**
   * Separator inserted between the prefix and the number. Defaults to
   * an empty string so fiat symbols (e.g. `$`, `€`) sit flush against
   * the number; set to a non-breaking space for word-like prefixes
   * (e.g. crypto tickers such as `ETH`).
   */
  prefixSeparator?: string;
  /**
   * Separator inserted between the number and the suffix. Defaults to a
   * non-breaking space so tickers stay glued on wrap; set to `""` for
   * percent-like suffixes.
   */
  suffixSeparator?: string;
};

/**
 * Format a number once and return all three representations consumed by
 * `Quote.formatted`: bare (`numberValue`), with its natural prefix
 * (`withPrefix`), and with its natural suffix (`withSuffix`).
 *
 * Keeping prefix / suffix composition on top of a single
 * {@link getFormattedNumber} call avoids running BigNumber's locale
 * pipeline three times per field while still giving downstream UIs the
 * flexibility to render any of the three variants.
 *
 * When `value` is nullish / NaN / non-finite, returns an all-empty
 * triplet so consumers can treat "missing data" identically across the
 * three fields (mirrors the `?? ""` convention in swap-live-app's
 * `useFormattedValues`).
 *
 * @param value - The underlying number to format.
 * @param options - Locale, decimal cap, and optional prefix / suffix.
 * @returns The {@link FormattedNumber} triplet for the supplied value.
 */
export function toFormattedNumber(
  value: BigNumber | number | string | undefined | null,
  options: ToFormattedNumberOptions,
): FormattedNumber {
  const {
    locale,
    numberOfDecimals,
    prefix = "",
    suffix = "",
    prefixSeparator = "",
    suffixSeparator = DEFAULT_SUFFIX_SEPARATOR,
  } = options;

  const numberValue = getFormattedNumber(value, { locale, numberOfDecimals });
  if (numberValue === "") {
    return EMPTY;
  }

  return {
    numberValue,
    withPrefix: prefix ? `${prefix}${prefixSeparator}${numberValue}` : numberValue,
    withSuffix: suffix ? `${numberValue}${suffixSeparator}${suffix}` : numberValue,
  };
}

/**
 * Convenience for empty-value branches (e.g. missing spot price) so call
 * sites do not have to spell out the triplet shape. Exported purely for
 * tests; runtime callers build triplets via {@link toFormattedNumber}.
 */
export const EMPTY_FORMATTED_NUMBER: FormattedNumber = EMPTY;
