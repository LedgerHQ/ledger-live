import { useMemo, useState } from "react";
import { useAccountsSyncStatus } from "@ledgerhq/live-common/bridge/react/index";
import type { SyncState } from "@ledgerhq/live-common/bridge/react/types";
import { useCountervaluesLoadStatus } from "@features/platform-market-countervalues";
import { useNetworkState } from "@shared/network-status";
import { useSelector } from "~/context/hooks";
import { accountsWithUpToDateCheckSelector } from "~/reducers/accounts";

/**
 * Account-scoped version of the Portfolio sync error rule (`usePortfolioBalance`):
 * bridge or countervalues error, account no longer up to date after having been, or offline.
 */
export function useAccountSyncError(accountId: string, syncState: SyncState): boolean {
  const { isConnected, isInternetReachable } = useNetworkState();
  const cvLoadStatus = useCountervaluesLoadStatus();

  const allAccountsWithUpToDateCheck = useSelector(accountsWithUpToDateCheckSelector);
  const accountsWithUpToDateCheck = useMemo(
    () => allAccountsWithUpToDateCheck.filter(({ account }) => account.id === accountId),
    [allAccountsWithUpToDateCheck, accountId],
  );
  const { areAllAccountsUpToDate } = useAccountsSyncStatus(accountsWithUpToDateCheck);

  const [hasEverBeenUpToDate, setHasEverBeenUpToDate] = useState(areAllAccountsUpToDate);
  if (areAllAccountsUpToDate && !hasEverBeenUpToDate) setHasEverBeenUpToDate(true);

  const isPending = cvLoadStatus.pending || syncState.pending;
  const hasCvOrBridgeError = !isPending && (!!cvLoadStatus.error || !!syncState.error);
  const hasAccountDegradation = hasEverBeenUpToDate && !areAllAccountsUpToDate;
  const isOffline = isConnected === false || isInternetReachable === false;

  return hasCvOrBridgeError || hasAccountDegradation || isOffline;
}
