import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";

interface FormatBalancePartsOptions {
  readonly unit: Unit;
  readonly balance: BigNumber;
  readonly locale: string;
  readonly discreet: boolean;
  readonly isFiat?: boolean;
}

interface BalanceParts {
  readonly integerPart: string;
  readonly decimalSeparator: string;
  readonly decimalDigits: string;
}

const splitFormattedBalance = (formatted: string): BalanceParts => {
  // Remove non-breaking spaces and normalize whitespace
  const normalized = formatted.replaceAll("\u00A0", "").replaceAll(/\s+/g, "");
  // Match decimal separator and digits, allowing optional currency symbol/code suffix
  // Handles both "$1,364.91" (prefix) and "1,364.91€" (suffix)
  // The suffix can be any non-digit characters (letters, symbols like €, $, etc.)
  const match = /^(.+?)([.,])(\d+)(\D*)$/.exec(normalized);
  if (match) {
    const suffix = match[4];
    // If there's a suffix, append it to the decimal digits
    return {
      integerPart: match[1],
      decimalSeparator: match[2],
      decimalDigits: suffix ? `${match[3]}${suffix}` : match[3],
    };
  }
  return { integerPart: normalized, decimalSeparator: "", decimalDigits: "" };
};

/**
 * Formats a balance value and splits it into integer and decimal parts.
 * Uses formatCurrencyUnit from coin-framework for consistent formatting.
 * The integer part includes the currency code and thousands separators.
 * The decimal part includes the decimal separator and digits.
 */
const CRYPTO_MAX_DECIMAL_DIGITS = 6;

export const formatBalanceParts = ({
  unit,
  balance,
  locale,
  discreet,
  isFiat = true,
}: FormatBalancePartsOptions): BalanceParts => {
  if (discreet) {
    return { integerPart: "***", decimalSeparator: "", decimalDigits: "" };
  }

  const formatted = formatCurrencyUnit(unit, balance, {
    locale,
    showCode: true,
    disableRounding: false,
    // Fiat: show all digits (typically 2), Crypto: use dynamic significant digits (max 6)
    showAllDigits: isFiat,
    dynamicSignificantDigits: isFiat ? undefined : CRYPTO_MAX_DECIMAL_DIGITS,
  });

  return splitFormattedBalance(formatted);
};
