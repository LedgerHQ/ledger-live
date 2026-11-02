import {
  POLLING_FINISHED_DELAY_MS,
  useAccountSyncState,
  useStablePending,
  useSyncLifecycle,
} from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesLoadStatus } from "@features/platform-market-countervalues";
import { useRefreshOutcome, type RefreshStatus } from "LLM/components/RefreshStatus";
import { useTranslation } from "~/context/Locale";
import { useAccountManualRefresh } from "./useAccountManualRefresh";
import { useAccountSyncError } from "./useAccountSyncError";

type Input = Readonly<{
  accountId: string;
  lastClickTimestamp: number;
  lastOfflineAttemptTimestamp: number;
}>;

export function useAccountRefreshStatusViewModel({
  accountId,
  lastClickTimestamp,
  lastOfflineAttemptTimestamp,
}: Input): RefreshStatus {
  const { t } = useTranslation();
  const syncState = useAccountSyncState({ accountId });
  const cvLoadStatus = useCountervaluesLoadStatus();
  const stablePending = useStablePending(
    syncState.pending || cvLoadStatus.pending,
    POLLING_FINISHED_DELAY_MS,
  );
  const isManualRefreshLoading = useAccountManualRefresh(
    syncState,
    stablePending,
    lastClickTimestamp,
  );
  const hasSyncError = useAccountSyncError(accountId, syncState);
  const syncPhase = useSyncLifecycle(isManualRefreshLoading, stablePending, hasSyncError);

  const status = useRefreshOutcome({
    syncPhase,
    isManualRefreshLoading,
    lastOfflineRefreshAttemptTimestamp: lastOfflineAttemptTimestamp,
  });

  return {
    ...status,
    labels: {
      refreshing: t("portfolio.refreshStatus.refreshing"),
      upToDate: t("accountDetail.refreshStatus.upToDate"),
      syncError: t("accountDetail.refreshStatus.syncError"),
      offline: t("portfolio.refreshStatus.offline"),
    },
  };
}
