import BigNumber from "bignumber.js";
import { formatPrice } from "@ledgerhq/live-currency-format";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { LineChartValueFormatter } from "../types";

export function createFiatLineChartValueFormatter(
  fiatUnit: Unit,
  locale: string,
): LineChartValueFormatter {
  return value =>
    formatPrice(fiatUnit, new BigNumber(value).times(10 ** fiatUnit.magnitude), {
      showCode: true,
      locale,
    });
}
