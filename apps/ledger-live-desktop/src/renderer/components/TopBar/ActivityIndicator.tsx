import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import {
  useBatchAccountsSyncState,
  useBridgeSync,
  useGlobalSyncState,
} from "@ledgerhq/live-common/bridge/react/index";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { getEnv } from "@ledgerhq/live-env";
import { track } from "~/renderer/analytics/segment";
import { isUpToDateSelector } from "~/renderer/reducers/accounts";
import IconLoader from "~/renderer/icons/Loader";
import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
import IconCheckCircle from "~/renderer/icons/CheckCircle";
import { Rotating } from "../Spinner";
import Tooltip from "../Tooltip";
import TranslatedError from "../TranslatedError";
import Box from "../Box";
import { ItemContainer } from "./shared";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { Text } from "@ledgerhq/react-ui";

const ActivityIndicatorInner = () => {
  const wsUserState = useWalletSyncUserState();
  const bridgeSync = useBridgeSync();
  const globalSyncState = useGlobalSyncState();
  const accountsWithUpToDateCheck = useSelector(isUpToDateSelector);
  const cvPolling = useCountervaluesPolling();

  const allAccounts = accountsWithUpToDateCheck.map(ojb => ojb.account);
  const allAccountsWithSyncProblem = useBatchAccountsSyncState({ accounts: allAccounts }).filter(
    ({ syncState, account }) =>
      !syncState.pending &&
      (syncState.error ||
        !accountsWithUpToDateCheck.find(obj => obj.account.id === account.id)?.isUpToDate),
  );
  const allMaybeAccountNames = useBatchMaybeAccountName(
    allAccountsWithSyncProblem.map(ojb => ojb.account),
  );
  const allAccountNamesWithSyncError = allMaybeAccountNames.map(
    (name, index) => name ?? getDefaultAccountName(allAccountsWithSyncProblem[index].account),
  );

  const areAllAccountsUpToDate = allAccountNamesWithSyncError.length === 0;

  const isPending = cvPolling.pending || globalSyncState.pending || wsUserState.visualPending;
  const syncError =
    !isPending && (cvPolling.error || globalSyncState.error || wsUserState.walletSyncError);

  const isError = !!syncError || !areAllAccountsUpToDate || !!wsUserState.walletSyncError;
  const error = (syncError ? globalSyncState.error : null) || wsUserState.walletSyncError;
  const [lastClickTime, setLastclickTime] = useState(0);
  const onClick = useCallback(() => {
    wsUserState.onUserRefresh();
    cvPolling.poll();
    bridgeSync({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
    setLastclickTime(Date.now());
    track("SyncRefreshClick");
  }, [cvPolling, bridgeSync, wsUserState]);
  const isSpectronRun = getEnv("PLAYWRIGHT_RUN"); // we will keep 'spinning' in spectron case
  const userClickTime = isSpectronRun ? 10000 : 1000;
  const isUserClick = Date.now() - lastClickTime < userClickTime; // time to keep display the spinning on a UI click.
  const isRotating = isPending && isUserClick;
  const isDisabled = isError || isRotating;

  const getIcon = () => {
    if (isError) return <IconExclamationCircle size={16} />;
    if (isRotating) return <IconLoader size={16} />;
    if (areAllAccountsUpToDate) return <IconCheckCircle size={16} />;
    return <IconExclamationCircle size={16} />;
  };

  const getText = () => {
    if (isRotating) return <Trans i18nKey="common.sync.syncing" />;
    if (isError) {
      return (
        <>
          <Box>
            <Trans i18nKey="common.sync.error" />
          </Box>
          <Box
            ml={2}
            style={{
              textDecoration: "underline",
              pointerEvents: "all",
              cursor: "pointer",
            }}
            onClick={onClick}
          >
            <Trans i18nKey="common.sync.refresh" />
          </Box>
        </>
      );
    }
    if (areAllAccountsUpToDate) {
      return (
        <span data-testid="topbar-synchronized">
          <Trans i18nKey="common.sync.upToDate" />
        </span>
      );
    }
    return <Trans i18nKey="common.sync.outdated" />;
  };

  const content = (
    <ItemContainer
      data-testid="topbar-synchronize-button"
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      isInteractive
    >
      <Rotating
        size={16}
        isRotating={isRotating}
        color={
          isError
            ? "alertRed"
            : isRotating
              ? "palette.text.shade60"
              : areAllAccountsUpToDate
                ? "positiveGreen"
                : "palette.text.shade60"
        }
      >
        {getIcon()}
      </Rotating>
      <Box
        ml={isRotating ? 2 : 1}
        ff="Inter|SemiBold"
        color={isError ? "alertRed" : undefined}
        fontSize={4}
        horizontal
        alignItems="center"
      >
        {getText()}
      </Box>
    </ItemContainer>
  );

  if (!areAllAccountsUpToDate || (isError && error)) {
    return (
      <Tooltip
        tooltipBg="alertRed"
        content={
          <Box
            fontSize={4}
            p={2}
            style={{
              maxWidth: 250,
            }}
          >
            {isError && error && areAllAccountsUpToDate ? (
              <TranslatedError error={error} />
            ) : (
              <Box>
                <Text mb={1} textAlign="left">
                  <Trans
                    i18nKey="common.sync.failingSync"
                    count={allAccountNamesWithSyncError.length}
                  />
                </Text>

                {allAccountNamesWithSyncError.map((accountName, index) => (
                  <Text key={index} textAlign="left">
                    <li>{accountName}</li>
                  </Text>
                ))}
              </Box>
            )}
          </Box>
        }
      >
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default ActivityIndicatorInner;
