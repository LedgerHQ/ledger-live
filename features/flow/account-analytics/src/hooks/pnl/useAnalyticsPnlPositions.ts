import { useMemo } from "react";
import type { AnalyticsCatalogState, AnalyticsPnlPositions, AnalyticsScope } from "../../types";
import { resolveAnalyticsPositions } from "../../logic/positions/resolveAnalyticsPositions";

export type AnalyticsPnlPositionsProps = Readonly<{
  scope: Pick<AnalyticsScope, "positionIds">;
  catalogStatus: AnalyticsCatalogState["status"];
}>;

export function useAnalyticsPnlPositions<Position extends Readonly<{ id: string }>>(
  { scope, catalogStatus }: AnalyticsPnlPositionsProps,
  positions: readonly Position[],
): AnalyticsPnlPositions<Position> {
  const selected = useMemo(
    () => resolveAnalyticsPositions(scope.positionIds, positions),
    [scope.positionIds, positions],
  );
  const pnlStatus = selected ? "ready" : "unavailable";
  return {
    positions: selected,
    status: catalogStatus === "ready" ? pnlStatus : catalogStatus,
  };
}
