import BigNumber from "bignumber.js";
import { formatPrice } from "@ledgerhq/live-currency-format";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { LineChartValueFormatter } from "../types";

function formatFiatAtomValue(
  fiatUnit: Unit,
  locale: string,
  discreet: boolean,
  atomValue: BigNumber,
): string {
  return formatPrice(fiatUnit, atomValue, { showCode: true, locale, discreet });
}

/**
 * For chart values expressed in the unit's main/display denomination
 * (e.g. market prices such as `50000` for $50,000).
 */
export function createFiatLineChartValueFormatter(
  fiatUnit: Unit,
  locale: string,
  discreet = false,
): LineChartValueFormatter {
  return value =>
    formatFiatAtomValue(
      fiatUnit,
      locale,
      discreet,
      new BigNumber(value).times(10 ** fiatUnit.magnitude),
    );
}

/**
 * For chart values already expressed in the unit's smallest atom (e.g. portfolio
 * countervalue data such as cents for USD), matching the contract of `formatPrice`.
 */
export function createSmallestUnitFiatLineChartValueFormatter(
  fiatUnit: Unit,
  locale: string,
  discreet = false,
): LineChartValueFormatter {
  return value => formatFiatAtomValue(fiatUnit, locale, discreet, new BigNumber(value));
}
