import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { accountsWithUpToDateCheckSelector, hasNoAccountsSelector } from "~/reducers/accounts";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import {
  useAccountsSyncStatus,
  useGlobalSyncState,
} from "@ledgerhq/live-common/bridge/react/index";

export function useSyncIndicator() {
  const { t } = useTranslation();
  const hasAccounts = !useSelector(hasNoAccountsSelector);
  const accountsWithUpToDateCheck = useSelector(accountsWithUpToDateCheckSelector);
  const cvPolling = useCountervaluesPolling();
  const globalSyncState = useGlobalSyncState();

  const { accountsWithError } = useAccountsSyncStatus(accountsWithUpToDateCheck);

  const maybeAccountNames = useBatchMaybeAccountName(accountsWithError);
  const listOfErrorAccountNames = useMemo(
    () =>
      maybeAccountNames
        .map((name, i) => name ?? getDefaultAccountName(accountsWithError[i]))
        .join("/"),
    [maybeAccountNames, accountsWithError],
  );

  const hasSyncError = accountsWithError.length > 0;
  const isPending = cvPolling.pending || globalSyncState.pending;
  const isError = hasSyncError || (!isPending && (!!cvPolling.error || !!globalSyncState.error));

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
