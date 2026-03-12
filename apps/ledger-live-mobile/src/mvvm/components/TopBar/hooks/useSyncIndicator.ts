import { useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useNetInfo } from "@react-native-community/netinfo";
import { accountsWithUpToDateCheckSelector, hasNoAccountsSelector } from "~/reducers/accounts";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import {
  useAccountsSyncStatus,
  useGlobalSyncState,
  useStablePending,
  useSyncLifecycle,
  useManualRefresh,
} from "@ledgerhq/live-common/bridge/react/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import {
  selectHasCompletedInitialSync,
  selectLastUserSyncClickTimestamp,
  setHasCompletedInitialSync,
  setSyncPhase,
} from "~/reducers/portfolioRefresh";

export function useSyncIndicator() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasAccounts = !useSelector(hasNoAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(accountsWithUpToDateCheckSelector);
  const cvPolling = useCountervaluesPolling();
  const globalSyncState = useGlobalSyncState();
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");
  const { isConnected, isInternetReachable } = useNetInfo();

  const { accountsWithError, areAllAccountsUpToDate } =
    useAccountsSyncStatus(accountsWithUpToDateCheck);

  const maybeAccountNames = useBatchMaybeAccountName(accountsWithError);
  const listOfErrorAccountNames = useMemo(
    () =>
      maybeAccountNames
        .map((name, i) => name ?? getDefaultAccountName(accountsWithError[i]))
        .join("/"),
    [maybeAccountNames, accountsWithError],
  );

  const rawPending = cvPolling.pending || globalSyncState.pending;
  const stablePending = useStablePending(rawPending);

  const hasCompletedInitialSync = useSelector(selectHasCompletedInitialSync);
  const lastUserSyncClickTimestamp = useSelector(selectLastUserSyncClickTimestamp);

  const prevStablePendingRef = useRef(stablePending);
  useEffect(() => {
    if (!shouldDisplayBalanceRefreshRework) return;

    const wasPending = prevStablePendingRef.current;
    prevStablePendingRef.current = stablePending;

    if (hasCompletedInitialSync) return;

    const transitioned = wasPending && !stablePending;
    const alreadySettled = !stablePending && !hasAccounts;
    if (transitioned || alreadySettled) {
      dispatch(setHasCompletedInitialSync(true));
    }
  }, [
    stablePending,
    hasCompletedInitialSync,
    hasAccounts,
    shouldDisplayBalanceRefreshRework,
    dispatch,
  ]);

  const isInitialLoading =
    shouldDisplayBalanceRefreshRework && hasAccounts && !hasCompletedInitialSync;
  const isManualRefreshLoading = useManualRefresh(stablePending, lastUserSyncClickTimestamp);
  const isBalanceLoading =
    shouldDisplayBalanceRefreshRework && (isInitialLoading || isManualRefreshLoading);

  const hasEverBeenUpToDateRef = useRef(areAllAccountsUpToDate);
  useEffect(() => {
    if (areAllAccountsUpToDate) {
      hasEverBeenUpToDateRef.current = true;
    }
  }, [areAllAccountsUpToDate]);

  const hasSyncError = accountsWithError.length > 0;
  const hasAccountDegradation = hasEverBeenUpToDateRef.current && !areAllAccountsUpToDate;
  const hasCvOrBridgeError = !rawPending && (!!cvPolling.error || !!globalSyncState.error);
  const isOffline = isConnected === false || isInternetReachable === false;
  const hasAnySyncError = hasCvOrBridgeError || hasAccountDegradation || hasSyncError || isOffline;

  const syncPhase = useSyncLifecycle(isBalanceLoading, stablePending, hasAnySyncError);

  let isError: boolean;
  let isPending: boolean;

  if (shouldDisplayBalanceRefreshRework) {
    isPending = syncPhase === "syncing";
    isError = syncPhase === "failed" || (!isPending && hasAnySyncError);
  } else {
    isPending = rawPending;
    isError = hasSyncError || (!isPending && (!!cvPolling.error || !!globalSyncState.error));
  }

  const effectiveSyncPhase = isPending ? "syncing" : isError ? "failed" : "synced";

  useEffect(() => {
    if (!shouldDisplayBalanceRefreshRework) return;
    dispatch(setSyncPhase(effectiveSyncPhase));
  }, [effectiveSyncPhase, shouldDisplayBalanceRefreshRework, dispatch]);

  let syncAccessibilityLabel;
  if (isError) {
    syncAccessibilityLabel = t("syncIndicator.accessibilityLabel.error");
  } else if (isPending) {
    syncAccessibilityLabel = t("syncIndicator.accessibilityLabel.syncing");
  } else {
    syncAccessibilityLabel = t("syncIndicator.accessibilityLabel.default");
  }

  return {
    hasAccounts,
    isError,
    isPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
  };
}
