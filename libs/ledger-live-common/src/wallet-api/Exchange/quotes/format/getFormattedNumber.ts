import BigNumber from "bignumber.js";

import { getLocaleSeparators } from "./getLocaleSeparators";

type Options = {
  locale?: string;
  prefix?: string;
  suffix?: string;
  numberOfDecimals?: number;
};

/**
 * Locale-aware number formatter for quote display strings:
 * non-breakable space (`\xA0`) between value and suffix, BigNumber-driven
 * `toFormat` to preserve precision beyond `Number.MAX_SAFE_INTEGER`, and
 * `""` for null / undefined / NaN / non-finite inputs.
 *
 * Higher-level callers should prefer {@link toFormattedNumber}, which
 * wraps this formatter and returns the `FormattedNumber` triplet used by
 * `Quote.formatted`.
 *
 * @param value - Number, numeric string, `BigNumber`, or nullish.
 * @param options - Locale, decimal cap, and optional prefix / suffix.
 * @returns The formatted string, or `""` when `value` is not a finite
 *   number.
 */
export function getFormattedNumber(
  value: string | number | BigNumber | undefined | null,
  options?: Options,
): string {
  if (value === undefined || value === null) {
    return "";
  }

  const locale = options?.locale || "en";

  let processedValue: BigNumber;

  if (BigNumber.isBigNumber(value)) {
    if (value.isNaN() || !value.isFinite()) {
      return "";
    }
    processedValue = value;
  } else {
    processedValue = new BigNumber(value);

    if (processedValue.isNaN() || !processedValue.isFinite()) {
      return "";
    }
  }

  const { decimal, thousands } = getLocaleSeparators(locale);

  const BN = BigNumber.clone({
    FORMAT: {
      prefix: options?.prefix || "",
      suffix: options?.suffix ? `\xA0${options.suffix}` : "",
      decimalSeparator: decimal,
      groupSeparator: thousands,
      groupSize: 3,
      secondaryGroupSize: 0,
      fractionGroupSeparator: "\xA0",
      fractionGroupSize: 0,
    },
  });

  const bigNumber = new BN(processedValue);
  const availableDecimals = bigNumber.decimalPlaces();

  if (
    options?.numberOfDecimals !== undefined &&
    availableDecimals !== null &&
    availableDecimals > options.numberOfDecimals
  ) {
    return bigNumber.toFormat(options.numberOfDecimals);
  }

  return bigNumber.toFormat();
}
