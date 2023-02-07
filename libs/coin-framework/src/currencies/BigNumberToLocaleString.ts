// Implement a subset of Number#toLocaleString for BigNumber.js
// https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number/toLocaleString
import { BigNumber } from "bignumber.js";
import { getSeparators } from "./localeUtility";
export type SupportedOptions = {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  useGrouping: boolean;
};

// FIXME later, might want to expose this format!
const getFormatForLocale = (locale: string) => {
  const { decimal, thousands } = getSeparators(locale);
  const opts = {
    decimalSeparator: ".",
    groupSeparator: ",",
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: "\xA0",
    // non-breaking space
    fractionGroupSize: 0,
  };
  if (typeof decimal === "string") opts.decimalSeparator = decimal;
  if (typeof thousands === "string") opts.groupSeparator = thousands;
  return opts;
};

export const toLocaleString = (
  n: BigNumber,
  localeInput?: string,
  options: Partial<SupportedOptions> = {}
): string => {
  let locale = localeInput;
  if (!locale) locale = "en";
  const minimumFractionDigits: number =
    "minimumFractionDigits" in options
      ? (options.minimumFractionDigits as number)
      : 0;
  const maximumFractionDigits: number =
    "maximumFractionDigits" in options
      ? (options.maximumFractionDigits as number)
      : Math.max(minimumFractionDigits, 3);
  const useGrouping = "useGrouping" in options ? options.useGrouping : true;
  const format = getFormatForLocale(locale);

  if (!useGrouping) {
    format.groupSeparator = "";
  }

  const BN = BigNumber.clone({
    FORMAT: format,
  });
  const bn = new BN(n);
  const maxDecimals = bn.toFormat(maximumFractionDigits, BigNumber.ROUND_FLOOR);

  if (maximumFractionDigits !== minimumFractionDigits) {
    const minDecimals = bn.toFormat(
      minimumFractionDigits,
      BigNumber.ROUND_FLOOR
    );
    let i = maxDecimals.length;

    // cleanup useless '0's from the right until the minimumFractionDigits
    while (i > minDecimals.length) {
      if (maxDecimals[i - 1] !== "0") {
        if (maxDecimals[i - 1] === format.decimalSeparator) {
          i--;
        }

        break; // we reach decimal. stop now.
      }

      i--;
    }

    return maxDecimals.slice(0, i);
  }

  return maxDecimals;
};
