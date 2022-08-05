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
};
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
  _options?: Partial<typeof defaultFormatOptions>
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

  const options = {};

  for (const k in _options) {
    // sanitize the undefined value
    if (_options[k] !== undefined) {
      options[k] = _options[k];
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
            4 - Math.round(Math.log10(floatValueAbs.toNumber())),
            magnitude + subMagnitude,
            8
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
  options?: Partial<typeof defaultFormatOptions>
): string {
  const joinFragmentsSeparator =
    (options && options.joinFragmentsSeparator) ||
    defaultFormatOptions.joinFragmentsSeparator;
  return formatCurrencyUnitFragment(unit, value, options)
    .map((f) => f.value)
    .join(joinFragmentsSeparator);
}
