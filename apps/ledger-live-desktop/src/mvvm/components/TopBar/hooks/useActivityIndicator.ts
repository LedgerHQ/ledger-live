import { useCallback, useMemo, useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasAccountsSelector, isUpToDateSelector } from "~/renderer/reducers/accounts";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import {
  useBatchAccountsSyncState,
  useBridgeSync,
  useGlobalSyncState,
} from "@ledgerhq/live-common/bridge/react/index";
import { getEnv } from "@ledgerhq/live-env";
import { track } from "~/renderer/analytics/segment";
import { useTranslation } from "react-i18next";
import { Refresh, Warning } from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";

export const useActivityIndicator = () => {
  const { t } = useTranslation();
  const hasAccounts = useSelector(hasAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
  const wsUserState = useWalletSyncUserState();
  const cvPolling = useCountervaluesPolling();
  const bridgeSync = useBridgeSync();
  const globalSyncState = useGlobalSyncState();
  const [lastClickTime, setLastClickTime] = useState(0);

  const allAccounts = accountsWithUpToDateCheck.map(item => item.account);
  const allAccountsWithSyncProblem = useBatchAccountsSyncState({ accounts: allAccounts }).filter(
    ({ syncState, account }) =>
      !syncState.pending &&
      (syncState.error ||
        !accountsWithUpToDateCheck.find(obj => obj.account.id === account.id)?.isUpToDate),
  );
  const errorAccountsTickers = allAccountsWithSyncProblem.map(item => item.account.currency.ticker);
  const listOfErrorAccountNames = errorAccountsTickers.join("/");
  const areAllAccountsUpToDate = errorAccountsTickers.length === 0;

  const isPending = cvPolling.pending || globalSyncState.pending || wsUserState.visualPending;
  const syncError =
    !isPending && (cvPolling.error || globalSyncState.error || wsUserState.walletSyncError);

  const isError = !!syncError || !areAllAccountsUpToDate || !!wsUserState.walletSyncError;
  const isPlaywrightRun = getEnv("PLAYWRIGHT_RUN"); // we will keep 'spinning' in playwright case
  const userClickTime = isPlaywrightRun ? 10000 : 1000;
  const isUserClick = Date.now() - lastClickTime < userClickTime; // time to keep display the spinning on a UI click.
  const isRotating = isPending && isUserClick;
  const isDisabled = isRotating;

  const tooltip = useMemo(
    () =>
      isError
        ? t("topBar.activityIndicator.errorToolTip", { accounts: listOfErrorAccountNames })
        : t("topBar.activityIndicator.refreshToolTip"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isError, listOfErrorAccountNames],
  );

  let icon = Refresh;
  if (isError) {
    icon = Warning;
  }
  if (isRotating) {
    icon = Spinner;
  }

  const handleSync = useCallback(() => {
    wsUserState.onUserRefresh();
    cvPolling.poll();
    bridgeSync({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
    setLastClickTime(Date.now());
    track("SyncRefreshClick");
  }, [wsUserState, cvPolling, bridgeSync]);

  return {
    hasAccounts,
    handleSync,
    isError,
    isRotating,
    isDisabled,
    tooltip,
    icon,
  };
};
