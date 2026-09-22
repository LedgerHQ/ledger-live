import type { Currency } from "@domain/entity-currency";
import type { AccountLike, Portfolio, PortfolioRange, ValueChange } from "@ledgerhq/types-live";
import { computeAllTimeValueChangeFromFirstReceive } from "./computeAllTimeValueChangeFromFirstReceive";
import type { RateSnapshot } from "./rateLookup";

export function resolveAnalyticsValueChange({
  selectedTimeRange,
  accounts,
  currentBalance,
  portfolio,
  cvState,
  counterValue,
}: {
  readonly selectedTimeRange: PortfolioRange;
  readonly accounts: AccountLike[];
  readonly currentBalance: number;
  readonly portfolio: Portfolio;
  readonly cvState: RateSnapshot;
  readonly counterValue: Currency;
}): ValueChange {
  if (selectedTimeRange === "all") {
    return computeAllTimeValueChangeFromFirstReceive(
      accounts,
      currentBalance,
      cvState,
      counterValue,
    );
  }

  return portfolio.countervalueChange;
}
