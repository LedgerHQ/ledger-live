import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { selectLastOfflineRefreshAttemptTimestamp } from "~/reducers/portfolioRefresh";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";
import { useRefreshOutcome, type RefreshStatus } from "LLM/components/RefreshStatus";

export const usePortfolioRefreshStatusViewModel = (): RefreshStatus => {
  const { t } = useTranslation();
  const lastOfflineRefreshAttemptTimestamp = useSelector(selectLastOfflineRefreshAttemptTimestamp);
  const { syncPhase, isManualRefreshLoading } = usePortfolioBalance();

  const status = useRefreshOutcome({
    syncPhase,
    isManualRefreshLoading,
    lastOfflineRefreshAttemptTimestamp,
  });

  return {
    ...status,
    labels: {
      refreshing: t("portfolio.refreshStatus.refreshing"),
      upToDate: t("portfolio.refreshStatus.upToDate"),
      syncError: t("portfolio.refreshStatus.syncError"),
      offline: t("portfolio.refreshStatus.offline"),
    },
  };
};
