import { BigNumber } from "bignumber.js";
import { prefixFormat, suffixFormat } from "./localeUtility";
import { toLocaleString } from "./BigNumberToLocaleString";
import type { Unit } from "@ledgerhq/types-cryptoassets";
const nonBreakableSpace = " ";
const defaultFormatOptions = {
  locale: "en-EN",
  // show the currency code
  showCode: false,
  // always show the sign, even if it's a positive value
  alwaysShowSign: false,
  // override showAllDigits of the unit
  showAllDigits: false,
  // disable the feature that only show significant digits
  // and removes the negligible extra digits.
  // (rounding is dynamically applied based on the value. higher value means more rounding)
  disableRounding: false,
  // enable or not the thousands grouping (e.g; 1,234.00)
  useGrouping: true,
  // this allow to increase the number of digits displayed
  // even if the currency don't allow more than this (sub-cent)
  // a value of 1 can display USD 0.006 for instance. 2 can display USD 0.0065
  // NB even if you set 3, USD 4.50 will be display as USD 4.50 , not 4.5000 (extra zeros are not displayed)
  subMagnitude: 0,
  // discrete mode will hide amounts
  discreet: false,
  joinFragmentsSeparator: "",
  // Increase the significant digits. Ex: For a value of 1.121212 BTC, dynamicSignificantDigits of 4 => 1.121 / dynamicSignificantDigits of 6 => 1.12121
  dynamicSignificantDigits: 6,
  staticSignificantDigits: 8,
};

export type formatCurrencyUnitOptions = Partial<typeof defaultFormatOptions>;

type FormatFragment =
  | {
      kind: "value";
      value: string;
    }
  | {
      kind: "sign";
      value: string;
    }
  | {
      kind: "code";
      value: string;
    }
  | {
      kind: "separator";
      value: string;
    };
type FormatFragmentTypes = "value" | "sign" | "code" | "separator";
export function formatCurrencyUnitFragment(
  unit: Unit,
  value: BigNumber,
  _options?: formatCurrencyUnitOptions
): FormatFragment[] {
  if (!BigNumber.isBigNumber(value)) {
    console.warn("formatCurrencyUnit called with value=", value);
    return [];
  }

  if (value.isNaN()) {
    console.warn("formatCurrencyUnit called with NaN value!");
    return [];
  }

  if (!value.isFinite()) {
    console.warn("formatCurrencyUnit called with infinite value=", value);
    return [];
  }

  const options: Record<
    string,
    formatCurrencyUnitOptions[keyof formatCurrencyUnitOptions]
  > = {};

  if (_options) {
    let k: keyof formatCurrencyUnitOptions;
    for (k in _options) {
      // sanitize the undefined value
      const value = _options[k];
      if (value !== undefined) {
        options[k] = value;
      }
    }
  }

  const {
    showCode,
    alwaysShowSign,
    showAllDigits,
    locale,
    disableRounding,
    useGrouping,
    subMagnitude,
    discreet,
    dynamicSignificantDigits,
    staticSignificantDigits,
  } = { ...defaultFormatOptions, ...unit, ...options };
  const { magnitude, code } = unit;
  const floatValue = value.div(new BigNumber(10).pow(magnitude));
  const floatValueAbs = floatValue.abs();
  const minimumFractionDigits = showAllDigits ? magnitude : 0;
  const maximumFractionDigits = disableRounding
    ? magnitude + subMagnitude
    : Math.max(
        minimumFractionDigits,
        Math.max(
          0, // dynamic max number of digits based on the value itself. to only show significant part
          Math.min(
            dynamicSignificantDigits -
              Math.ceil(Math.log10(floatValueAbs.toNumber())),
            magnitude + subMagnitude,
            staticSignificantDigits
          )
        )
      );
  const fragValueByKind = {
    sign:
      alwaysShowSign || floatValue.isNegative()
        ? floatValue.isNegative()
          ? "-"
          : "+"
        : null,
    code: showCode ? code : null,
    value: discreet
      ? "***"
      : toLocaleString(floatValueAbs, locale, {
          maximumFractionDigits,
          minimumFractionDigits,
          useGrouping,
        }),
    separator: nonBreakableSpace,
  };
  const frags: FormatFragment[] = [];
  let nonSepIndex = -1;
  let sepConsumed = true;
  (unit.prefixCode ? prefixFormat : suffixFormat).forEach((kind) => {
    const v = fragValueByKind[kind];
    if (!v) return;
    const isSep = kind === "separator";
    if (sepConsumed && isSep) return;
    sepConsumed = isSep;
    if (!isSep) nonSepIndex = frags.length;
    frags.push({
      kind: kind as FormatFragmentTypes,
      value: v,
    });
  });
  frags.splice(nonSepIndex + 1); // remove extra space at the end

  return frags;
}
// simplification of formatCurrencyUnitFragment if no fragmented styles is needed
export function formatCurrencyUnit(
  unit: Unit,
  value: BigNumber,
  options?: formatCurrencyUnitOptions
): string {
  const joinFragmentsSeparator =
    (options && options.joinFragmentsSeparator) ||
    defaultFormatOptions.joinFragmentsSeparator;
  return formatCurrencyUnitFragment(unit, value, options)
    .map((f) => f.value)
    .join(joinFragmentsSeparator);
}
