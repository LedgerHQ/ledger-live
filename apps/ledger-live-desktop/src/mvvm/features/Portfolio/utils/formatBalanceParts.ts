import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";

interface FormatBalancePartsOptions {
  readonly unit: Unit;
  readonly balance: number;
  readonly locale: string;
  readonly discreet: boolean;
  readonly currencyTicker?: string;
}

interface BalanceParts {
  readonly integerPart: string;
  readonly decimalSeparator: string;
  readonly decimalDigits: string;
}

const splitFormattedBalance = (formatted: string): BalanceParts => {
  // Remove non-breaking spaces and normalize whitespace
  const normalized = formatted.replace(/\u00A0/g, "").replace(/\s+/g, "");
  // Use greedy match to get everything before the last decimal separator
  const match = normalized.match(/^(.+)([.,])(\d{2})$/);
  return match
    ? { integerPart: match[1], decimalSeparator: match[2], decimalDigits: match[3] }
    : { integerPart: normalized, decimalSeparator: "", decimalDigits: "" };
};

/**
 * Formats a balance value and splits it into integer and decimal parts.
 * The integer part includes the currency symbol and thousands separators.
 * The decimal part includes the decimal separator and digits.
 */
export const formatBalanceParts = ({
  unit,
  balance,
  locale,
  discreet,
  currencyTicker,
}: FormatBalancePartsOptions): BalanceParts => {
  if (discreet) {
    return { integerPart: "***", decimalSeparator: "", decimalDigits: "" };
  }

  const floatValue = BigNumber(balance).div(new BigNumber(10).pow(unit.magnitude)).toNumber();

  const currencyCode = currencyTicker || unit.code;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return splitFormattedBalance(formatter.format(floatValue));
  } catch {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return splitFormattedBalance(`${unit.code}${formatter.format(floatValue)}`);
  }
};
