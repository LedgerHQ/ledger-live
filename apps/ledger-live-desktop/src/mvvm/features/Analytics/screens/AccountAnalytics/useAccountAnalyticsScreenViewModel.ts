import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { AnalyticsPeriod } from "@features/flow-account-analytics";
import { findFiatCurrencyByTicker, getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { useSelector } from "LLD/hooks/redux";
import { useSyncSources } from "LLD/hooks/useSyncSources";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getAccountUrl } from "~/renderer/utils";
import { useAnalyticsCatalogAdapter } from "../../hooks/useAnalyticsCatalogAdapter";
import { useAnalyticsBalanceAdapter } from "../../hooks/useAnalyticsBalanceAdapter";
import { resolveAnalyticsEntry } from "../../utils/resolveAnalyticsEntry";

const PERIODS = {
  day: "1d",
  week: "1w",
  month: "1m",
  year: "1y",
  all: "all",
} as const satisfies Record<string, AnalyticsPeriod>;

const UNSUPPORTED_COUNTERVALUE_FIAT = getFiatCurrencyByTicker("USD").ticker;

export function useAccountAnalyticsScreenViewModel() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const accounts = useSelector(accountsSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const { catalog, positions, refreshCatalog } = useAnalyticsCatalogAdapter();
  const dataPort = useAnalyticsBalanceAdapter(positions);
  const initialSelection = useMemo(() => resolveAnalyticsEntry(location.state), [location.state]);
  const { triggerRefresh } = useSyncSources();
  const onRefresh = useCallback(() => {
    if (refreshCatalog) void refreshCatalog();
    triggerRefresh();
  }, [refreshCatalog, triggerRefresh]);
  const onBack = useCallback(() => {
    const account = accounts.find(candidate => candidate.id === initialSelection?.accountId);
    navigate(account ? getAccountUrl(account.id) : "/");
  }, [accounts, initialSelection, navigate]);
  return {
    title: t("analytics.title"),
    onBack,
    selectedTimeRange,
    counterValue,
    positions,
    visitKey: location.key,
    analyticsProps: {
      catalog,
      dataPort,
      initialSelection,
      fiatCurrencyId:
        findFiatCurrencyByTicker(counterValue.ticker)?.ticker ?? UNSUPPORTED_COUNTERVALUE_FIAT,
      period: PERIODS[selectedTimeRange],
      onRefresh,
    },
  };
}
