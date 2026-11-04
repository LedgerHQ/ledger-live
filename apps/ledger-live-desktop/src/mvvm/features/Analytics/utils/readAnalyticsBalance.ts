import type {
  AnalyticsBalanceData,
  AnalyticsQueryContext,
  AnalyticsReadResult,
} from "@features/flow-account-analytics";
import type { CounterValuesState } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { getPortfolio } from "@ledgerhq/live-common/portfolio/portfolio";
import {
  lineChartRangeToPortfolioRange,
  resolveAnalyticsValueChange,
} from "@ledgerhq/wallet-analytics";
import { readAnalyticsPositionValue } from "./readAnalyticsPositionValue";
import { resolveAnalyticsPositions } from "./resolveAnalyticsPositions";

export function readAnalyticsBalance(
  context: AnalyticsQueryContext,
  positions: readonly AccountLike[],
  countervalues: CounterValuesState,
  fiatCurrency: Currency,
): AnalyticsReadResult<AnalyticsBalanceData> {
  if (context.metric !== "balance" || context.fiatCurrencyId !== fiatCurrency.ticker)
    return { status: "unavailable" };
  const range = lineChartRangeToPortfolioRange(context.period);
  const selected = resolveAnalyticsPositions(context.positionIds, positions);
  if (!range || !selected) return { status: "unavailable" };

  const hasUnpricedHolding = selected.some(
    position => readAnalyticsPositionValue(position, countervalues, fiatCurrency) === null,
  );
  if (hasUnpricedHolding) return { status: "unavailable" };

  const portfolio = getPortfolio(selected, range, countervalues, fiatCurrency, {
    flattenSourceAccounts: false,
  });
  const withHistory = new Set(portfolio.availableAccounts.map(account => account.id));
  const hasHoldingWithoutHistory = selected.some(
    position => !position.balance.isZero() && !withHistory.has(position.id),
  );
  if (hasHoldingWithoutHistory) return { status: "unavailable" };

  const amount = portfolio.balanceHistory.at(-1)?.value ?? 0;
  const variation = resolveAnalyticsValueChange({
    selectedTimeRange: range,
    accounts: selected,
    currentBalance: amount,
    portfolio,
    cvState: countervalues,
    counterValue: fiatCurrency,
  });
  return {
    status: "ready",
    data: {
      amount,
      variation: { amount: variation.value, ratio: variation.percentage ?? null },
      history: portfolio.balanceHistory.map(point => ({
        timestamp: point.date.getTime(),
        amount: point.value,
      })),
    },
  };
}
