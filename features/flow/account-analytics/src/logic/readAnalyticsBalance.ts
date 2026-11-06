import type {
  AnalyticsBalanceData,
  AnalyticsCountervalueInput,
  AnalyticsPositionSource,
  AnalyticsQueryContext,
  AnalyticsReadResult,
  ReadAnalyticsPortfolio,
} from "../types";
import { toAnalyticsPortfolioRange } from "./analyticsPeriod";
import { resolveAnalyticsPositions } from "./resolveAnalyticsPositions";
import { selectPricedAnalyticsPositions } from "./selectPricedAnalyticsPositions";

export type ReadAnalyticsBalanceInput<Position extends AnalyticsPositionSource> =
  AnalyticsCountervalueInput &
    Readonly<{ positions: readonly Position[]; readPortfolio: ReadAnalyticsPortfolio<Position> }>;

export function readAnalyticsBalance<Position extends AnalyticsPositionSource>(
  context: AnalyticsQueryContext,
  { positions, readPortfolio, ...countervalueInput }: ReadAnalyticsBalanceInput<Position>,
): AnalyticsReadResult<AnalyticsBalanceData> {
  if (context.metric !== "balance" || context.fiatCurrencyId !== countervalueInput.fiat.ticker)
    return { status: "unavailable" };
  const selected = resolveAnalyticsPositions(context.positionIds, positions);
  if (!selected) return { status: "unavailable" };

  const { priced, hasOnlyUnpricedHoldings } = selectPricedAnalyticsPositions(
    selected,
    countervalueInput,
  );
  if (hasOnlyUnpricedHoldings) return { status: "unavailable" };

  const portfolio = readPortfolio(priced, toAnalyticsPortfolioRange(context.period));
  const withHistory = new Set(portfolio.positionIdsWithHistory);
  const hasHoldingWithoutHistory = priced.some(
    position => !position.balance.isZero() && !withHistory.has(position.id),
  );
  if (hasHoldingWithoutHistory) return { status: "unavailable" };

  const amount = portfolio.history.at(-1)?.amount ?? 0;
  return {
    status: "ready",
    data: { amount, variation: portfolio.readVariation(amount), history: portfolio.history },
  };
}
