import { useState, useEffect, useRef } from "react";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { selectIsRefreshing, selectSyncPhase } from "~/reducers/portfolioRefresh";

export const UP_TO_DATE_VISIBLE_DURATION_MS = 3_000;

type RefreshOutcome = "success" | "error" | null;

interface UsePortfolioRefreshStatusViewModelResult {
  isVisible: boolean;
  isRefreshing: boolean;
  refreshingLabel: string;
  upToDateLabel: string;
  syncErrorLabel: string;
  outcome: RefreshOutcome;
}

export const usePortfolioRefreshStatusViewModel = (): UsePortfolioRefreshStatusViewModelResult => {
  const { t } = useTranslation();
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");
  const legacyIsRefreshing = useSelector(selectIsRefreshing);
  const syncPhase = useSelector(selectSyncPhase);

  const isSyncing = shouldDisplayBalanceRefreshRework
    ? syncPhase === "syncing"
    : legacyIsRefreshing;

  const [outcome, setOutcome] = useState<RefreshOutcome>(null);
  const prevIsSyncingRef = useRef(isSyncing);

  useEffect(() => {
    if (isSyncing) {
      setOutcome(null);
      prevIsSyncingRef.current = true;
      return;
    }

    if (!prevIsSyncingRef.current) return;
    prevIsSyncingRef.current = false;

    const result: RefreshOutcome = syncPhase === "failed" ? "error" : "success";
    setOutcome(result);

    const timer = setTimeout(() => setOutcome(null), UP_TO_DATE_VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isSyncing, syncPhase]);

  // Late error detection: if syncPhase becomes "failed" after we showed "success",
  // switch to error immediately.
  useEffect(() => {
    if (!shouldDisplayBalanceRefreshRework) return;
    if (outcome === "success" && syncPhase === "failed") {
      setOutcome("error");
    }
  }, [syncPhase, outcome, shouldDisplayBalanceRefreshRework]);

  return {
    isVisible: isSyncing || outcome !== null,
    isRefreshing: isSyncing,
    outcome,
    refreshingLabel: t("portfolio.refreshStatus.refreshing"),
    upToDateLabel: t("portfolio.refreshStatus.upToDate"),
    syncErrorLabel: t("portfolio.refreshStatus.syncError"),
  };
};
