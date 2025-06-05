import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";
import { useCallback } from "react";

export function useSyncAccountById() {
  const setSyncBehavior = useBridgeSync();
  const { onUserRefresh } = useWalletSyncUserState();
  const { poll } = useCountervaluesPolling();

  const syncAccountById = useCallback(
    (accountId?: string) => {
      if (!accountId) return;

      poll();
      setSyncBehavior({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: 100,
        reason: "refresh-swap-history-single-account",
      });

      onUserRefresh();
    },
    [poll, setSyncBehavior, onUserRefresh],
  );

  return syncAccountById;
}
