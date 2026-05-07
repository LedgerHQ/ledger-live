import { useState, useEffect, useRef } from "react";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  selectIsRefreshing,
  selectLastOfflineRefreshAttemptTimestamp,
} from "~/reducers/portfolioRefresh";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";

export const REFRESH_STATUS_VISIBLE_DURATION_MS = 3_000;

type RefreshOutcome = "success" | "error" | "offline" | null;

interface UsePortfolioRefreshStatusViewModelResult {
  isVisible: boolean;
  isRefreshing: boolean;
  refreshingLabel: string;
  upToDateLabel: string;
  syncErrorLabel: string;
  offlineLabel: string;
  outcome: RefreshOutcome;
}

export const usePortfolioRefreshStatusViewModel = (): UsePortfolioRefreshStatusViewModelResult => {
  const { t } = useTranslation();
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");
  const legacyIsRefreshing = useSelector(selectIsRefreshing);
  const lastOfflineRefreshAttemptTimestamp = useSelector(selectLastOfflineRefreshAttemptTimestamp);
  const { syncPhase, isManualRefreshLoading } = usePortfolioBalance();

  // Stays true for the entire sync cycle once the user triggers a refresh;
  // reset when sync leaves "syncing" (either "synced" or "failed"). Never set at cold start.
  const wasUserTriggeredRef = useRef(false);
  if (isManualRefreshLoading) {
    wasUserTriggeredRef.current = true;
  } else if (syncPhase !== "syncing") {
    wasUserTriggeredRef.current = false;
  }

  const isSyncing = shouldDisplayBalanceRefreshRework
    ? syncPhase === "syncing" && wasUserTriggeredRef.current
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

    const timer = setTimeout(() => setOutcome(null), REFRESH_STATUS_VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isSyncing, syncPhase]);

  useEffect(() => {
    if (!shouldDisplayBalanceRefreshRework) return;
    if (outcome === "success" && syncPhase === "failed") {
      setOutcome("error");
    }
  }, [syncPhase, outcome, shouldDisplayBalanceRefreshRework]);

  useEffect(() => {
    if (!shouldDisplayBalanceRefreshRework || !lastOfflineRefreshAttemptTimestamp) return;
    setOutcome("offline");
    const timer = setTimeout(() => setOutcome(null), REFRESH_STATUS_VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [lastOfflineRefreshAttemptTimestamp, shouldDisplayBalanceRefreshRework]);

  return {
    isVisible: isSyncing || outcome !== null,
    isRefreshing: isSyncing,
    outcome,
    refreshingLabel: t("portfolio.refreshStatus.refreshing"),
    upToDateLabel: t("portfolio.refreshStatus.upToDate"),
    syncErrorLabel: t("portfolio.refreshStatus.syncError"),
    offlineLabel: t("portfolio.refreshStatus.offline"),
  };
};
