import type {
  AnalyticsCountervalueInput,
  AnalyticsPositionSource,
  AnalyticsReadResult,
} from "../types";
import { selectPricedAnalyticsPositions } from "./selectPricedAnalyticsPositions";

export function readAnalyticsCurrentBalance(
  positions: readonly AnalyticsPositionSource[],
  input: AnalyticsCountervalueInput,
): AnalyticsReadResult<number> {
  const { amount, hasOnlyUnpricedHoldings } = selectPricedAnalyticsPositions(positions, input);
  return hasOnlyUnpricedHoldings ? { status: "unavailable" } : { status: "ready", data: amount };
}
