import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-currency-format";

interface FormatBalancePartsOptions {
  readonly unit: Unit;
  readonly balance: BigNumber;
  readonly locale: string;
  readonly discreet: boolean;
}

interface BalanceParts {
  readonly integerPart: string;
  readonly decimalSeparator: string;
  readonly decimalDigits: string;
}

/**
 * Formats a balance value and splits it into integer and decimal parts.
 * Uses formatCurrencyUnitFragment from live-currency-format for structured output.
 * The integer part includes the currency code (if prefix) and thousands separators.
 * The decimal part includes the digits and currency code (if suffix).
 */

export const formatBalanceParts = ({
  unit,
  balance,
  locale,
  discreet,
}: FormatBalancePartsOptions): BalanceParts => {
  if (discreet) {
    return { integerPart: "***", decimalSeparator: "", decimalDigits: "" };
  }

  const fragment = formatCurrencyUnitFragment(unit, balance, {
    locale,
    showCode: true,
  });

  const { integerPart, decimalPart, decimalSeparator, currencyText, currencyPosition } = fragment;

  // Build the integer part with currency prefix if applicable
  const formattedIntegerPart =
    currencyPosition === "start" ? `${currencyText}${integerPart}` : integerPart;

  // Build the decimal digits with currency suffix if applicable
  const formattedDecimalDigits =
    currencyPosition === "end" && decimalPart ? `${decimalPart}${currencyText}` : decimalPart;

  return {
    integerPart: formattedIntegerPart,
    decimalSeparator: decimalPart ? decimalSeparator : "",
    decimalDigits: formattedDecimalDigits,
  };
};
