//@flow
import type { BigNumber } from "bignumber.js";
import type { Unit } from "../../types";
import { getFragPositions } from "./localeUtility";

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
  subMagnitude: 0
};

type FormatFragment =
  | { kind: "value", value: string }
  | { kind: "sign", value: string }
  | { kind: "code", value: string }
  | { kind: "separator", value: string };

export function formatCurrencyUnitFragment(
  unit: Unit,
  bigNumberValue: BigNumber,
  options?: $Shape<typeof defaultFormatOptions>
): FormatFragment[] {
  const value = bigNumberValue.toNumber(); // FIXME quick escape hatch

  if (typeof value !== "number") {
    console.warn("formatCurrencyUnit called with value=", value);
    return [];
  }
  if (isNaN(value)) {
    console.warn("formatCurrencyUnit called with NaN value!");
    return [];
  }
  if (!isFinite(value)) {
    console.warn("formatCurrencyUnit called with infinite value=", value);
    return [];
  }
  const {
    showCode,
    alwaysShowSign,
    showAllDigits,
    locale,
    disableRounding,
    useGrouping,
    subMagnitude
  } = {
    ...defaultFormatOptions,
    ...unit,
    ...options
  };
  const { magnitude, code } = unit;
  const floatValue = value / 10 ** magnitude;
  const floatValueAbs = Math.abs(floatValue);
  const minimumFractionDigits = showAllDigits ? magnitude : 0;
  const maximumFractionDigits = disableRounding
    ? magnitude + subMagnitude
    : Math.max(
        minimumFractionDigits,
        Math.max(
          0,
          // dynamic max number of digits based on the value itself. to only show significant part
          Math.min(
            4 - Math.round(Math.log10(floatValueAbs)),
            magnitude + subMagnitude
          )
        )
      );

  const fragValueByKind = {
    sign:
      alwaysShowSign || floatValue < 0 ? (floatValue < 0 ? "-" : "+") : null,
    code: showCode ? code : null,
    value: floatValueAbs.toLocaleString(locale, {
      maximumFractionDigits,
      minimumFractionDigits,
      useGrouping
    }),
    separator: nonBreakableSpace
  };

  const frags = [];
  let nonSepIndex = -1,
    sepConsumed = true;
  getFragPositions(locale).forEach(kind => {
    const value = fragValueByKind[kind];
    if (!value) return;
    const isSep = kind === "separator";
    if (sepConsumed && isSep) return;
    sepConsumed = isSep;
    if (!isSep) nonSepIndex = frags.length;
    // $FlowFixMe
    frags.push({ kind, value });
  });
  frags.splice(nonSepIndex + 1); // remove extra space at the end
  return frags;
}

// simplification of formatCurrencyUnitFragment if no fragmented styles is needed
export function formatCurrencyUnit(
  unit: Unit,
  value: BigNumber,
  options?: $Shape<typeof defaultFormatOptions>
): string {
  return formatCurrencyUnitFragment(unit, value, options)
    .map(f => f.value)
    .join("");
}
