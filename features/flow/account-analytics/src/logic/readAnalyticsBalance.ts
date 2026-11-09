import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type {
  AnalyticsBalanceData,
  AnalyticsPositionSource,
  AnalyticsQueryContext,
  AnalyticsReadResult,
  ReadAnalyticsPortfolio,
} from "../types";
import { toAnalyticsPortfolioRange } from "./analyticsPeriod";
import { resolveAnalyticsPositions } from "./resolveAnalyticsPositions";
import { selectPricedAnalyticsPositions } from "./selectPricedAnalyticsPositions";

export function readAnalyticsBalance<Position extends AnalyticsPositionSource>(
  context: AnalyticsQueryContext,
  positions: readonly Position[],
  countervalues: CounterValuesCacheView,
  fiatCurrency: Currency,
  readPortfolio: ReadAnalyticsPortfolio<Position>,
): AnalyticsReadResult<AnalyticsBalanceData> {
  if (context.metric !== "balance" || context.fiatCurrencyId !== fiatCurrency.ticker)
    return { status: "unavailable" };
  const range = toAnalyticsPortfolioRange(context.period);
  const selected = resolveAnalyticsPositions(context.positionIds, positions);
  if (!selected) return { status: "unavailable" };

  const { priced, hasOnlyUnpricedHoldings } = selectPricedAnalyticsPositions(
    selected,
    countervalues,
    fiatCurrency,
  );
  if (hasOnlyUnpricedHoldings) return { status: "unavailable" };

  const portfolio = readPortfolio(priced, range);
  const withHistory = new Set(portfolio.availableAccounts.map(account => account.id));
  const hasHoldingWithoutHistory = priced.some(
    position => !position.balance.isZero() && !withHistory.has(position.id),
  );
  if (hasHoldingWithoutHistory) return { status: "unavailable" };

  const amount = portfolio.balanceHistory.at(-1)?.value ?? 0;
  const variation = portfolio.readVariation(amount);
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
