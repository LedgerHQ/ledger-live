import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

type FormatFiatBalanceOptions = Readonly<{
  locale: string;
  discreet?: boolean;
}>;

export function formatFiatBalanceForDisplay(
  unit: Unit,
  value: BigNumber.Value,
  { locale, discreet }: FormatFiatBalanceOptions,
): string {
  const fragment = formatCurrencyUnitFragment(unit, new BigNumber(value), {
    locale,
    discreet,
    showCode: true,
    disableRounding: true,
    showAllDigits: true,
  });

  const amount = fragment.decimalPart
    ? `${fragment.integerPart}${fragment.decimalSeparator}${fragment.decimalPart}`
    : fragment.integerPart;

  if (fragment.currencyPosition === "start" && fragment.currencyText) {
    return `${fragment.currencyText} ${amount}`;
  }

  if (fragment.currencyText) {
    return `${amount} ${fragment.currencyText}`;
  }

  return amount;
}
