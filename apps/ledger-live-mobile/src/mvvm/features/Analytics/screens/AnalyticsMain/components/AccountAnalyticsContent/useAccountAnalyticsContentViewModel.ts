import { useCallback, useMemo } from "react";
import {
  parseAnalyticsEntryState,
  type AccountAnalyticsProps,
  toAnalyticsPeriod,
} from "@features/flow-account-analytics";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, selectedTimeRangeSelector } from "~/reducers/settings";
import { useSyncSources } from "LLM/hooks/useSyncSources";
import type { ScreenName } from "~/const";
import type { AnalyticsNavigatorParamsList } from "LLM/features/Analytics/types";
import { useAnalyticsCatalogAdapter } from "LLM/features/Analytics/hooks/useAnalyticsCatalogAdapter";
import { useAnalyticsBalanceAdapter } from "LLM/features/Analytics/hooks/useAnalyticsBalanceAdapter";

export type AccountAnalyticsContentProps = Readonly<{
  routeKey: string;
  params: AnalyticsNavigatorParamsList[ScreenName.Analytics] | undefined;
}>;

export type AccountAnalyticsContentViewModel = Readonly<{
  positions: readonly AccountLike[];
  visitKey: string;
  analyticsProps: Omit<AccountAnalyticsProps, "renderBalance" | "renderPnl">;
}>;

export function useAccountAnalyticsContentViewModel({
  routeKey,
  params,
}: AccountAnalyticsContentProps): AccountAnalyticsContentViewModel {
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const { catalog, positions, refreshCatalog } = useAnalyticsCatalogAdapter();
  const dataPort = useAnalyticsBalanceAdapter(positions);
  const initialSelection = useMemo(() => parseAnalyticsEntryState(params), [params]);
  const { triggerRefresh } = useSyncSources();
  const onRefresh = useCallback(() => {
    if (refreshCatalog) void refreshCatalog();
    triggerRefresh();
  }, [refreshCatalog, triggerRefresh]);
  return {
    positions,
    visitKey: [routeKey, initialSelection?.accountId, initialSelection?.currencyId].join(":"),
    analyticsProps: {
      catalog,
      dataPort,
      initialSelection,
      fiatCurrencyId: counterValue.ticker,
      period: toAnalyticsPeriod(selectedTimeRange),
      onRefresh,
    },
  };
}
