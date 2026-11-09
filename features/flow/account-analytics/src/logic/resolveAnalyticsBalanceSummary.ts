import type {
  AnalyticsBalanceData,
  AnalyticsBalanceSummary,
  AnalyticsCatalogState,
  AnalyticsReadResult,
  AnalyticsResultState,
  AnalyticsVariationStatus,
} from "../types";

export type AnalyticsBalanceSummaryInput = Readonly<{
  balance: AnalyticsResultState<AnalyticsBalanceData>;
  catalogStatus: AnalyticsCatalogState["status"];
  current: AnalyticsReadResult<number>;
  retained: Readonly<{ data: AnalyticsBalanceData | undefined; isStale: boolean }>;
}>;

function toVariationStatus(
  status: AnalyticsResultState<AnalyticsBalanceData>["status"],
  isStale: boolean,
): AnalyticsVariationStatus {
  if (isStale) return "ready";
  if (status === "loading" || status === "ready") return status;
  return "unavailable";
}

export function resolveAnalyticsBalanceSummary({
  balance,
  catalogStatus,
  current,
  retained,
}: AnalyticsBalanceSummaryInput): AnalyticsBalanceSummary {
  return {
    current,
    data: retained.data,
    isCurrentAvailable: current.status === "ready" && catalogStatus === "ready",
    isCatalogLoading: catalogStatus === "loading",
    isChartLoading: balance.status === "loading" && !retained.isStale,
    variationStatus: toVariationStatus(balance.status, retained.isStale),
    showHeaderStatus:
      catalogStatus === "error" || (catalogStatus === "ready" && current.status !== "ready"),
    showPlotStatus: balance.status === "error" || balance.status === "unavailable",
  };
}
