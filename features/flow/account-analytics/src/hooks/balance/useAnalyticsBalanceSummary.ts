import { useMemo } from "react";
import type {
  AnalyticsBalanceData,
  AnalyticsBalanceSummary,
  AnalyticsCatalogState,
  AnalyticsCountervalueInput,
  AnalyticsPositionSource,
  AnalyticsQueryContext,
  AnalyticsResultState,
} from "../../types";
import { readAnalyticsCurrentBalance } from "../../logic/balance/readAnalyticsCurrentBalance";
import { resolveAnalyticsBalanceSummary } from "../../logic/balance/resolveAnalyticsBalanceSummary";
import { resolveAnalyticsPositions } from "../../logic/positions/resolveAnalyticsPositions";
import { useRetainedAnalyticsBalance } from "./useRetainedAnalyticsBalance";

export type AnalyticsBalanceSummaryProps = Readonly<{
  balance: AnalyticsResultState<AnalyticsBalanceData>;
  context: Pick<AnalyticsQueryContext, "positionIds">;
  catalogStatus: AnalyticsCatalogState["status"];
}>;

export function useAnalyticsBalanceSummary(
  { balance, context, catalogStatus }: AnalyticsBalanceSummaryProps,
  {
    positions,
    countervalues,
    fiat,
  }: AnalyticsCountervalueInput & Readonly<{ positions: readonly AnalyticsPositionSource[] }>,
): AnalyticsBalanceSummary {
  const current = useMemo(() => {
    const selected = resolveAnalyticsPositions(context.positionIds, positions);
    return selected
      ? readAnalyticsCurrentBalance(selected, countervalues, fiat)
      : ({ status: "unavailable" } as const);
  }, [context.positionIds, positions, countervalues, fiat]);
  const retained = useRetainedAnalyticsBalance(balance);
  return useMemo(
    () => resolveAnalyticsBalanceSummary({ balance, catalogStatus, current, retained }),
    [balance, catalogStatus, current, retained],
  );
}
