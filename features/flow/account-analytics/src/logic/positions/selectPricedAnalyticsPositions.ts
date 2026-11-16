import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AnalyticsPositionSource } from "../../types";
import { readAnalyticsPositionValue } from "./readAnalyticsPositionValue";

export type PricedAnalyticsPositions<Position> = Readonly<{
  priced: Position[];
  amount: number;
  hasOnlyUnpricedHoldings: boolean;
}>;

/** Held positions without a price are left out, as in the Portfolio, so one unpriced token cannot hide the whole selection. */
export function selectPricedAnalyticsPositions<Position extends AnalyticsPositionSource>(
  positions: readonly Position[],
  countervalues: CounterValuesCacheView,
  fiat: Currency,
): PricedAnalyticsPositions<Position> {
  const priced: Position[] = [];
  let amount = 0;
  let hasPricedHolding = false;
  let hasUnpricedHolding = false;
  for (const position of positions) {
    const value = readAnalyticsPositionValue(position, countervalues, fiat);
    if (value === null) {
      hasUnpricedHolding = true;
      continue;
    }
    if (!position.balance.isZero()) hasPricedHolding = true;
    priced.push(position);
    amount += value;
  }
  return { priced, amount, hasOnlyUnpricedHoldings: hasUnpricedHolding && !hasPricedHolding };
}
