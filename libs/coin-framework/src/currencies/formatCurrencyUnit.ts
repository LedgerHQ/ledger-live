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

// TODO: configure global precision elsewhere, default is 20
BigNumber.set({ DECIMAL_PLACES: 40, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

/**
 * Compute natural logarithm ln(x) using a Taylor series around 1
 * Accurate for x close to 1 (1 ≤ x < 10)
 */
function ln(x: BigNumber, terms = 30) {
  if (x.lte(0)) throw new Error("ln is undefined for non-positive numbers");

  // Use transformation: ln(x) = 2 * sum_k [((x - 1)/(x + 1))^(2k - 1) / (2k - 1)]
  const one = new BigNumber(1);
  const y = x.minus(one).div(x.plus(one)); // y = (x - 1) / (x + 1)
  const ySquared = y.times(y);

  let result = new BigNumber(0);
  let term = y;

  for (let k = 1; k <= terms; k += 2) {
    if (k > 1) {
      term = term.times(ySquared);
    }
    result = result.plus(term.div(k));
  }

  return result.times(2);
}

function log10BigNumber(value: bigint | number | BigNumber, lnTerms = 30) {
  let x;
  if (typeof value === "bigint") {
    x = new BigNumber(value.toString());
  } else {
    x = new BigNumber(value);
  }

  if (x.lte(0)) {
    throw new Error("log10 is undefined for zero or negative values.");
  }

  const digits = x.toFixed(0).length;
  // mantissa in [1, 10)
  const mantissa = x.div(new BigNumber(10).pow(digits - 1));
  const lnMantissa = ln(mantissa, lnTerms);
  const ln10 = ln(new BigNumber(10), lnTerms);
  const fractional = lnMantissa.div(ln10);
  return new BigNumber(digits - 1).plus(fractional);
}

function bigNumberCeil(bn: BigNumber): BigNumber {
  return bn.integerValue(BigNumber.ROUND_CEIL);
}

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
function formatCurrencyUnitFragment(
  unit: Unit,
  value: BigNumber,
  _options?: formatCurrencyUnitOptions,
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

  const options: Record<string, formatCurrencyUnitOptions[keyof formatCurrencyUnitOptions]> = {};

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
            dynamicSignificantDigits - bigNumberCeil(log10BigNumber(floatValueAbs)).toNumber(),
            magnitude + subMagnitude,
            staticSignificantDigits,
          ),
        ),
      );
  const fragValueByKind = {
    sign: alwaysShowSign || floatValue.isNegative() ? (floatValue.isNegative() ? "-" : "+") : null,
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
  (unit.prefixCode ? prefixFormat : suffixFormat).forEach(kind => {
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
  options?: formatCurrencyUnitOptions,
): string {
  const joinFragmentsSeparator =
    (options && options.joinFragmentsSeparator) || defaultFormatOptions.joinFragmentsSeparator;
  return formatCurrencyUnitFragment(unit, value, options)
    .map(f => f.value)
    .join(joinFragmentsSeparator);
}
