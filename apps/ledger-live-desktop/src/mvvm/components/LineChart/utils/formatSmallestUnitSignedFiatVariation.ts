import BigNumber from "bignumber.js";
import { formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import type { Unit } from "@domain/entity-currency-unit";

export function formatSmallestUnitSignedFiatVariation(
  value: number,
  unit: Unit,
  locale: string,
): string {
  const mainUnitValue = new BigNumber(value).shiftedBy(-unit.magnitude).toNumber();
  return formatSignedFiatVariation(mainUnitValue, unit, locale);
}
