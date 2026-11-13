import { useCallback, useMemo } from "react";
import { useAccountAnalyticsViewModel } from "./useAccountAnalyticsViewModel";
import { useAccountAnalyticsLabels } from "./copy/useAccountAnalyticsLabels";
import type { AccountAnalyticsProps, AccountAnalyticsViewProps } from "./AccountAnalytics.types";

export function useAccountAnalyticsScreenViewModel(
  props: AccountAnalyticsProps,
): AccountAnalyticsViewProps {
  const model = useAccountAnalyticsViewModel(props);
  const labels = useAccountAnalyticsLabels();
  const { onRefresh } = props;
  const { retry } = model;
  const { assetId, accountId, fiatCurrencyId, positionIds } = model.context;
  const scope = useMemo(
    () => ({ assetId, accountId, fiatCurrencyId, positionIds }),
    [assetId, accountId, fiatCurrencyId, positionIds],
  );
  const onRetry = useCallback(() => {
    onRefresh();
    retry();
  }, [onRefresh, retry]);
  return {
    model,
    labels,
    onRetry,
    scope,
    catalogStatus: props.catalog.status,
    renderBalance: props.renderBalance,
    renderPnl: props.renderPnl,
  };
}
