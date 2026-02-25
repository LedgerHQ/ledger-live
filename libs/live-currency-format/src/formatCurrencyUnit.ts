import { BigNumber } from "bignumber.js";
import { getSeparators } from "./localeUtility";
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

export type FormatterValue = {
  integerPart: string;
  decimalPart: string;
  decimalSeparator: "." | ",";
  currencyText: string;
  currencyPosition: "start" | "end";
};

type FormatState = {
  value: string;
  sign: string | null;
  code: string | null;
  decimalSeparator: "." | ",";
  currencyPosition: "start" | "end";
};

type ResolvedFormatOptions = typeof defaultFormatOptions & Unit;

const buildFormatState = (
  unit: Unit,
  value: BigNumber,
  _options?: formatCurrencyUnitOptions,
): FormatState => {
  const emptyState = (): FormatState => ({
    value: "",
    sign: null,
    code: null,
    decimalSeparator: ".",
    currencyPosition: unit.prefixCode ? "start" : "end",
  });

  if (!BigNumber.isBigNumber(value)) {
    console.warn("formatCurrencyUnit called with value=", value);
    return emptyState();
  }

  if (value.isNaN()) {
    console.warn("formatCurrencyUnit called with NaN value!");
    return emptyState();
  }

  if (!value.isFinite()) {
    console.warn("formatCurrencyUnit called with infinite value=", value);
    return emptyState();
  }

  const options: Record<string, formatCurrencyUnitOptions[keyof formatCurrencyUnitOptions]> = {};

  if (_options) {
    let k: keyof formatCurrencyUnitOptions;
    for (k in _options) {
      // sanitize the undefined value
      const optionValue = _options[k];
      if (optionValue !== undefined) {
        options[k] = optionValue;
      }
    }
  }

  const resolvedOptions: ResolvedFormatOptions = {
    ...defaultFormatOptions,
    ...unit,
    ...options,
  };
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
  } = resolvedOptions;
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
            dynamicSignificantDigits - Math.ceil(Math.log(floatValueAbs.toNumber()) / Math.log(10)),
            magnitude + subMagnitude,
            staticSignificantDigits,
          ),
        ),
      );
  const sign =
    alwaysShowSign || floatValue.isNegative() ? (floatValue.isNegative() ? "-" : "+") : null;
  const formattedValue = discreet
    ? "***"
    : toLocaleString(floatValueAbs, locale, {
        maximumFractionDigits,
        minimumFractionDigits,
        useGrouping,
      });

  const separators = getSeparators(locale);
  const decimalSeparator = separators.decimal === "," ? "," : ".";
  const currencyPosition = unit.prefixCode ? "start" : "end";
  return {
    value: formattedValue,
    sign,
    code: showCode ? code : null,
    decimalSeparator,
    currencyPosition,
  };
};

export const formatCurrencyUnitFragment = (
  unit: Unit,
  value: BigNumber,
  options?: formatCurrencyUnitOptions,
): FormatterValue => {
  const {
    value: formattedValue,
    sign,
    code,
    decimalSeparator,
    currencyPosition,
  } = buildFormatState(unit, value, options);
  const hasDecimals = formattedValue.indexOf(decimalSeparator) !== -1;
  const [integerPartRaw, decimalPartRaw] = hasDecimals
    ? formattedValue.split(decimalSeparator)
    : [formattedValue, ""];

  let integerPart = integerPartRaw;
  const decimalPart = decimalPartRaw || "";
  let currencyText = code || "";

  if (sign) {
    if (currencyPosition === "start" && currencyText) {
      currencyText = `${sign}${currencyText}`;
    } else {
      integerPart = `${sign}${integerPart}`;
    }
  }

  return {
    integerPart,
    decimalPart,
    decimalSeparator,
    currencyText,
    currencyPosition,
  };
};

// simplification of formatCurrencyUnitFragment if no fragmented styles is needed
export const formatCurrencyUnit = (
  unit: Unit,
  value: BigNumber,
  options?: formatCurrencyUnitOptions,
): string => {
  const joinFragmentsSeparator =
    (options && options.joinFragmentsSeparator) || defaultFormatOptions.joinFragmentsSeparator;
  const { value: formattedValue, sign, code } = buildFormatState(unit, value, options);
  const parts: string[] = [];

  if (unit.prefixCode) {
    // prefixFormat: ["sign", "code", "value"]
    if (sign) parts.push(sign);
    if (code) parts.push(code);
    parts.push(formattedValue);
  } else {
    // suffixFormat: ["sign", "value", "separator", "code"]
    if (sign) parts.push(sign);
    parts.push(formattedValue);
    if (code) {
      parts.push(nonBreakableSpace);
      parts.push(code);
    }
  }

  return parts.join(joinFragmentsSeparator);
};
