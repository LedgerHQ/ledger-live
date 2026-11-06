import { useCallback, useMemo } from "react";
import {
  parseAnalyticsEntryState,
  resolveAnalyticsFiatCurrencyId,
  toAnalyticsPeriod,
} from "@features/flow-account-analytics";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, selectedTimeRangeSelector } from "~/reducers/settings";
import { useSyncSources } from "LLM/hooks/useSyncSources";
import type { ScreenName } from "~/const";
import type { AnalyticsNavigatorParamsList } from "../../../../types";
import { useAnalyticsCatalogAdapter } from "../../../../hooks/useAnalyticsCatalogAdapter";
import { useAnalyticsBalanceAdapter } from "../../../../hooks/useAnalyticsBalanceAdapter";

export type AccountAnalyticsContentProps = Readonly<{
  routeKey: string;
  params: AnalyticsNavigatorParamsList[ScreenName.Analytics] | undefined;
}>;

export function useAccountAnalyticsContentViewModel({
  routeKey,
  params,
}: AccountAnalyticsContentProps) {
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
      fiatCurrencyId: resolveAnalyticsFiatCurrencyId(counterValue.ticker),
      period: toAnalyticsPeriod(selectedTimeRange),
      onRefresh,
    },
  };
}
