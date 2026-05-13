import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";

/** Extra fractional digits for sub-unit prices (e.g. BONK at "$0.00001"). */
const DEFAULT_PRICE_SUB_MAGNITUDE = 8;

export type FormatPriceOptions = {
  showCode?: boolean;
  locale?: string;
  discreet?: boolean;
  subMagnitude?: number;
};

/**
 * Format a fiat price. Sub-unit values (< 1 fiat unit) are rendered with
 * `subMagnitude` extra digits so memecoin prices don't collapse to "$0.00".
 */
export function formatPrice(
  unit: Unit,
  value: BigNumber,
  options: FormatPriceOptions = {},
): string {
  const absValue = value.abs();
  const isSubUnit = !absValue.isZero() && absValue.lt(new BigNumber(10).pow(unit.magnitude));
  const subMagnitude = isSubUnit ? options.subMagnitude ?? DEFAULT_PRICE_SUB_MAGNITUDE : 0;
  return formatCurrencyUnit(unit, value, {
    showCode: options.showCode ?? false,
    locale: options.locale,
    discreet: options.discreet,
    disableRounding: isSubUnit,
    subMagnitude,
  });
}
