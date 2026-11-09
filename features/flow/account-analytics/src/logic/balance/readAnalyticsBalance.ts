import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type {
  AnalyticsBalanceData,
  AnalyticsPeriod,
  AnalyticsPortfolioRange,
  AnalyticsPositionSource,
  AnalyticsQueryContext,
  AnalyticsReadResult,
  ReadAnalyticsPortfolio,
} from "../../types";
import { resolveAnalyticsPositions } from "../positions/resolveAnalyticsPositions";
import { selectPricedAnalyticsPositions } from "../positions/selectPricedAnalyticsPositions";

const RANGE_BY_PERIOD = {
  "1d": "day",
  "1w": "week",
  "1m": "month",
  "1y": "year",
  all: "all",
} as const satisfies Record<AnalyticsPeriod, AnalyticsPortfolioRange>;

export function readAnalyticsBalance<
  Position extends AnalyticsPositionSource,
  Countervalues extends CounterValuesCacheView,
>(
  context: AnalyticsQueryContext,
  positions: readonly Position[],
  countervalues: Countervalues,
  fiatCurrency: Currency,
  readPortfolio: ReadAnalyticsPortfolio<Position, Countervalues>,
): AnalyticsReadResult<AnalyticsBalanceData> {
  if (context.metric !== "balance" || context.fiatCurrencyId !== fiatCurrency.ticker)
    return { status: "unavailable" };
  const range = RANGE_BY_PERIOD[context.period];
  const selected = resolveAnalyticsPositions(context.positionIds, positions);
  if (!selected) return { status: "unavailable" };

  const { priced, hasOnlyUnpricedHoldings } = selectPricedAnalyticsPositions(
    selected,
    countervalues,
    fiatCurrency,
  );
  if (hasOnlyUnpricedHoldings) return { status: "unavailable" };

  const portfolio = readPortfolio(priced, range, countervalues, fiatCurrency);
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
