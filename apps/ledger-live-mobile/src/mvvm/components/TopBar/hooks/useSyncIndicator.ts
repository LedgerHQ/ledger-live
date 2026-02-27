import { useSelector } from "~/context/hooks";
import { accountsWithUpToDateCheckSelector, hasNoAccountsSelector } from "~/reducers/accounts";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import {
  getAggregateSyncState,
  useAccountsSyncStatus,
  useGlobalSyncState,
} from "@ledgerhq/live-common/bridge/react/index";

export function useSyncIndicator() {
  const hasAccounts = !useSelector(hasNoAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(accountsWithUpToDateCheckSelector);
  const wsUserState = useWalletSyncUserState();
  const cvPolling = useCountervaluesPolling();
  const globalSyncState = useGlobalSyncState();

  const { areAllAccountsUpToDate, accountsWithError } =
    useAccountsSyncStatus(accountsWithUpToDateCheck);
  const maybeAccountNames = useBatchMaybeAccountName(accountsWithError);
  const listOfErrorAccountNames = maybeAccountNames
    .map((name, i) => name ?? getDefaultAccountName(accountsWithError[i]))
    .join("/");

  const { isPending, isError } = getAggregateSyncState({
    areAllAccountsUpToDate,
    bridgeOrCvPending: cvPolling.pending || globalSyncState.pending,
    bridgeOrCvError: !!cvPolling.error || !!globalSyncState.error,
    walletSyncPending: wsUserState.visualPending,
    walletSyncError: !!wsUserState.walletSyncError,
  });

  const syncAccessibilityLabel = isError ? "Sync error" : isPending ? "Syncing" : "Synchronize";

  return {
    hasAccounts,
    isError,
    isPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
  };
}
