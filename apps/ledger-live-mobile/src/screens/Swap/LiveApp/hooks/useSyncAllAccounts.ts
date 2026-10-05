import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@features/platform-market-countervalues";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";
import { useCallback } from "react";

export function useSyncAllAccounts() {
  const setSyncBehavior = useBridgeSync();
  const { onUserRefresh } = useWalletSyncUserState();
  const { poll } = useCountervaluesPolling();

  const syncAccounts = useCallback(() => {
    poll();
    setSyncBehavior({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "refresh-swap-history",
    });

    onUserRefresh();
  }, [poll, setSyncBehavior, onUserRefresh]);

  return syncAccounts;
}
