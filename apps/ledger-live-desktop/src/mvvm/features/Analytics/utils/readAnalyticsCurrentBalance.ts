import type { AnalyticsReadResult } from "@features/flow-account-analytics";
import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { readAnalyticsPositionValue } from "./readAnalyticsPositionValue";

export function readAnalyticsCurrentBalance(
  positions: readonly AccountLike[],
  countervalues: CounterValuesCacheView,
  fiat: Currency,
): AnalyticsReadResult<number> {
  let amount = 0;
  for (const position of positions) {
    const value = readAnalyticsPositionValue(position, countervalues, fiat);
    if (value === null) return { status: "unavailable" };
    amount += value;
  }
  return { status: "ready", data: amount };
}
