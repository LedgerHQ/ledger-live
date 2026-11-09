import { useMemo } from "react";
import { useAnalyticsBalanceSummary } from "@features/flow-account-analytics";
import type { AnalyticsBalanceRenderProps } from "@features/flow-account-analytics/web";
import type { AccountLike } from "@ledgerhq/types-live";
import { useCountervaluesState } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

export type AnalyticsBalanceRendererProps = AnalyticsBalanceRenderProps &
  Readonly<{ positions: readonly AccountLike[] }>;

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
  const summary = useAnalyticsBalanceSummary(
    { balance, context, catalogStatus },
    { positions, countervalues, fiat },
  );
  const { currentAmount, data } = summary;
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
      totalBalance: currentAmount,
      isAvailable: summary.isCurrentAvailable,
      valueChange: {
        value: data?.variation.amount ?? 0,
        percentage: data?.variation.ratio ?? null,
      },
    }),
    [data, currentAmount, summary.isCurrentAvailable],
  );
  return {
    contextKey,
    portfolio,
    balanceInfo,
    isLoading: summary.isCatalogLoading,
    isChartLoading: summary.isChartLoading,
    variationStatus: summary.variationStatus,
    headerContent: summary.showHeaderStatus ? statusContent : undefined,
    filters,
    plotContent: summary.showPlotStatus ? statusContent : undefined,
  };
}
