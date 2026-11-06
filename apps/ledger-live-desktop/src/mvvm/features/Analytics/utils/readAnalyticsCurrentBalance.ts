import type { AnalyticsReadResult } from "@features/flow-account-analytics";
import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { selectPricedAnalyticsPositions } from "./selectPricedAnalyticsPositions";

export function readAnalyticsCurrentBalance(
  positions: readonly AccountLike[],
  countervalues: CounterValuesCacheView,
  fiat: Currency,
): AnalyticsReadResult<number> {
  const { amount, hasOnlyUnpricedHoldings } = selectPricedAnalyticsPositions(
    positions,
    countervalues,
    fiat,
  );
  return hasOnlyUnpricedHoldings ? { status: "unavailable" } : { status: "ready", data: amount };
}
