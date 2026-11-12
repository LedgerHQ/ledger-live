import type BigNumber from "bignumber.js";
import { toLocaleString } from "@ledgerhq/live-currency-format";

export function formatDisplayAmount(
  amount: BigNumber,
  decimals: number,
  roundingMode: BigNumber.RoundingMode,
  locale: string,
): string {
  return toLocaleString(amount.decimalPlaces(decimals, roundingMode), locale, {
    maximumFractionDigits: decimals,
  });
}
