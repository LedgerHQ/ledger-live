import { useMemo } from "react";
import type { AnalyticsBalanceRenderProps } from "@features/flow-account-analytics/web";
import type { AccountLike } from "@ledgerhq/types-live";
import { useCountervaluesState } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { resolveAnalyticsPositions } from "../../utils/resolveAnalyticsPositions";
import { readAnalyticsCurrentBalance } from "../../utils/readAnalyticsCurrentBalance";
import type { ChartVariationStatus } from "../ChartSection/types";

export type AnalyticsBalanceRendererProps = AnalyticsBalanceRenderProps &
  Readonly<{ positions: readonly AccountLike[] }>;

function toChartVariationStatus(
  status: AnalyticsBalanceRenderProps["balance"]["status"],
): ChartVariationStatus {
  if (status === "loading" || status === "ready") return status;
  return "unavailable";
}

export function useAnalyticsBalanceRendererViewModel({
  balance,
  filters,
  statusContent,
  contextKey,
  context,
  positions,
  catalogStatus,
}: AnalyticsBalanceRendererProps) {
  const countervalues = useCountervaluesState();
  const fiat = useSelector(counterValueCurrencySelector);
  const current = useMemo(() => {
    const selected = resolveAnalyticsPositions(context.positionIds, positions);
    return selected
      ? readAnalyticsCurrentBalance(selected, countervalues, fiat)
      : { status: "unavailable" as const };
  }, [context.positionIds, positions, countervalues, fiat]);
  const data = balance.status === "ready" ? balance.data : undefined;
  const portfolio = useMemo(
    () => ({
      balanceHistory:
        data?.history.map(point => ({ date: new Date(point.timestamp), value: point.amount })) ??
        [],
    }),
    [data],
  );
  const balanceInfo = useMemo(
    () => ({
      totalBalance: current.status === "ready" ? current.data : 0,
      isAvailable: current.status === "ready" && catalogStatus === "ready",
      valueChange: {
        value: data?.variation.amount ?? 0,
        percentage: data?.variation.ratio ?? null,
      },
    }),
    [data, current, catalogStatus],
  );
  return {
    contextKey,
    portfolio,
    balanceInfo,
    isLoading: catalogStatus === "loading",
    isChartLoading: balance.status === "loading",
    variationStatus: toChartVariationStatus(balance.status),
    headerContent:
      catalogStatus === "error" || (catalogStatus === "ready" && current.status !== "ready")
        ? statusContent
        : undefined,
    filters,
    plotContent:
      balance.status === "error" || balance.status === "unavailable" ? statusContent : undefined,
  };
}
