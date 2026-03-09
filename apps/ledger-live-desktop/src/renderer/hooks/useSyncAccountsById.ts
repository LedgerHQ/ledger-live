import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";
import { useCallback } from "react";

export function useSyncAccountsById() {
  const setSyncBehavior = useBridgeSync();
  const { onUserRefresh } = useWalletSyncUserState();
  const { poll } = useCountervaluesPolling();

  const syncAccountsById = useCallback(
    (accountIds: string[]) => {
      const filtered = accountIds.filter(Boolean);
      if (!filtered.length) return;
      poll();
      setSyncBehavior({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds: filtered,
        priority: 10,
        reason: "refresh-swap-accounts",
      });
      onUserRefresh();
    },
    [poll, setSyncBehavior, onUserRefresh],
  );

  return syncAccountsById;
}
