import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AnalyticsPositionSource, AnalyticsReadResult } from "../../types";
import { selectPricedAnalyticsPositions } from "../positions/selectPricedAnalyticsPositions";

export function readAnalyticsCurrentBalance(
  positions: readonly AnalyticsPositionSource[],
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
