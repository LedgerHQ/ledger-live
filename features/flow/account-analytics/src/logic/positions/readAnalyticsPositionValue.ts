import { calculate, type CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AnalyticsPositionSource } from "../../types";
import { getAnalyticsPositionCurrency } from "./analyticsPositionSource";

/** A held position without a usable price reads `null`, so no caller can sum a partial total. */
export function readAnalyticsPositionValue(
  position: AnalyticsPositionSource,
  countervalues: CounterValuesCacheView,
  fiat: Currency,
): number | null {
  if (position.balance.isZero()) return 0;
  const value = calculate(countervalues, {
    from: getAnalyticsPositionCurrency(position),
    to: fiat,
    value: position.balance.toNumber(),
  });
  return value != null && Number.isFinite(value) ? value : null;
}
