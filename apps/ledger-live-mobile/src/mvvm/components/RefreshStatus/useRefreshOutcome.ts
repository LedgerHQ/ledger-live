import { useEffect, useRef, useState } from "react";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";
import type { RefreshOutcome } from "./types";

export const REFRESH_STATUS_VISIBLE_DURATION_MS = 3_000;

type Input = Readonly<{
  syncPhase: SyncPhase;
  isManualRefreshLoading: boolean;
  lastOfflineRefreshAttemptTimestamp: number;
}>;

type Result = Readonly<{
  isVisible: boolean;
  isRefreshing: boolean;
  outcome: RefreshOutcome;
}>;

export function useRefreshOutcome({
  syncPhase,
  isManualRefreshLoading,
  lastOfflineRefreshAttemptTimestamp,
}: Input): Result {
  // Stays true for the entire sync cycle once the user triggers a refresh;
  // reset when sync leaves "syncing" (either "synced" or "failed"). Never set at cold start.
  const wasUserTriggeredRef = useRef(false);
  if (isManualRefreshLoading) {
    wasUserTriggeredRef.current = true;
  } else if (syncPhase !== "syncing") {
    wasUserTriggeredRef.current = false;
  }

  const isSyncing = syncPhase === "syncing" && wasUserTriggeredRef.current;

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
    if (outcome === "success" && syncPhase === "failed") {
      setOutcome("error");
    }
  }, [syncPhase, outcome]);

  useEffect(() => {
    if (!lastOfflineRefreshAttemptTimestamp) return;
    setOutcome("offline");
    const timer = setTimeout(() => setOutcome(null), REFRESH_STATUS_VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [lastOfflineRefreshAttemptTimestamp]);

  return { isVisible: isSyncing || outcome !== null, isRefreshing: isSyncing, outcome };
}
