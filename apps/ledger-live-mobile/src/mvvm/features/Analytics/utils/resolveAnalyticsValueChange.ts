import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Portfolio, PortfolioRange, ValueChange } from "@ledgerhq/types-live";
import { computeAllTimeValueChangeFromFirstReceive } from "./computeAllTimeValueChangeFromFirstReceive";

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
  readonly cvState: CounterValuesState;
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
