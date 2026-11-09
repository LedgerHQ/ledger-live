import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { readAnalyticsPositionValue } from "./readAnalyticsPositionValue";

export type PricedAnalyticsPositions = Readonly<{
  priced: AccountLike[];
  amount: number;
  hasOnlyUnpricedHoldings: boolean;
}>;

/** Held positions without a price are left out, as in the Portfolio, so one unpriced token cannot hide the whole selection. */
export function selectPricedAnalyticsPositions(
  positions: readonly AccountLike[],
  countervalues: CounterValuesCacheView,
  fiat: Currency,
): PricedAnalyticsPositions {
  const priced: AccountLike[] = [];
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
