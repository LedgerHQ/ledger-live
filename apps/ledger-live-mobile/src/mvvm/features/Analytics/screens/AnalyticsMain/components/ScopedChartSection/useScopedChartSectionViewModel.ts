import { useMemo } from "react";
import {
  useAnalyticsBalanceSummary,
  type AnalyticsBalanceRenderProps,
} from "@features/flow-account-analytics";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useChartSectionModel } from "../ChartSection/useChartSectionModel";
import type { ChartSectionSlots, ChartSectionViewModel } from "../ChartSection/types";

export type ScopedChartSectionProps = AnalyticsBalanceRenderProps &
  Readonly<{ positions: readonly AccountLike[] }>;

export function useScopedChartSectionViewModel({
  balance,
  context,
  contextKey,
  catalogStatus,
  filters,
  statusContent,
  positions,
}: ScopedChartSectionProps): ChartSectionSlots & Readonly<{ viewModel: ChartSectionViewModel }> {
  const countervalues = useCountervaluesCache();
  const fiat = useSelector(counterValueCurrencySelector);
  const summary = useAnalyticsBalanceSummary(
    { balance, context, catalogStatus },
    { positions, countervalues, fiat },
  );
  const { currentAmount, data } = summary;
  const { prices, timestamps } = useMemo(
    () => ({
      prices: data?.history.map(point => point.amount) ?? [],
      timestamps: data?.history.map(point => point.timestamp) ?? [],
    }),
    [data],
  );
  const valueChange = useMemo(
    () => ({ value: data?.variation.amount ?? 0, percentage: data?.variation.ratio ?? null }),
    [data],
  );
  const scopedBalance = useMemo(
    () => ({
      amount: currentAmount,
      isLoading: summary.isCatalogLoading,
      isAvailable: summary.isCurrentAvailable,
    }),
    [currentAmount, summary.isCatalogLoading, summary.isCurrentAvailable],
  );
  const viewModel = useChartSectionModel({
    prices,
    timestamps,
    valueChange,
    isVariationAvailable: summary.isCurrentAvailable && summary.variationStatus === "ready",
    isVariationLoading: summary.isCurrentAvailable && summary.variationStatus === "loading",
    isChartLoading: summary.isChartLoading,
    contextKey,
    balance: scopedBalance,
  });
  return {
    viewModel,
    filters,
    headerContent: summary.showHeaderStatus ? statusContent : undefined,
    plotContent: summary.showPlotStatus ? statusContent : undefined,
  };
}
