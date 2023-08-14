import React, { useCallback, useMemo } from "react";
import { BridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector, useDispatch, useStore } from "react-redux";
import logger from "~/renderer/logger";
import {
  updateAccountWithUpdater,
  updateAllAccountsWithUpdater,
} from "~/renderer/actions/accounts";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { recentlyChangedExperimental } from "~/renderer/experimental";
import { recentlyKilledInternalProcess } from "~/renderer/reset";
import { track } from "~/renderer/analytics/segment";
import { prepareCurrency, hydrateCurrency } from "./cache";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import {
  walletSyncAuthSelector,
  walletSyncVersionSelector,
  walletSyncDescriptorsSelector,
} from "../reducers/walletsync";
import { setWalletSyncPayload, setVersion } from "../actions/walletsync";

export const BridgeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const dispatch = useDispatch();
  const updateAccount = useCallback(
    (accountId, updater) => dispatch(updateAccountWithUpdater(accountId, updater)),
    [dispatch],
  );
  const updateAllAccounts = useCallback(
    updater => dispatch(updateAllAccountsWithUpdater(updater)),
    [dispatch],
  );
  const recoverError = useCallback(error => {
    const isInternalProcessError = error && error.message.includes("Internal process error");
    if (
      isInternalProcessError &&
      (recentlyKilledInternalProcess() || recentlyChangedExperimental())
    ) {
      // This error is normal because the thread was recently killed. we silent it for the user.
      return;
    }
    logger.critical(error);
    return error;
  }, []);

  const walletSyncAuth = useSelector(walletSyncAuthSelector);

  const store = useStore();
  const getVersion = useCallback(() => walletSyncVersionSelector(store.getState()), [store]);
  const getLatestWalletSyncPayload = useCallback(
    () => walletSyncDescriptorsSelector(store.getState()),
    [store],
  );

  const onVersionUpdate = useCallback(
    version => {
      dispatch(setVersion(version));
    },
    [dispatch],
  );
  const walletSyncVersionManager = useMemo(
    () => ({
      onVersionUpdate,
      getVersion,
    }),
    [onVersionUpdate, getVersion],
  );

  const setLatestWalletSyncPayload = useCallback(
    descriptors => {
      dispatch(setWalletSyncPayload(descriptors));
    },
    [dispatch],
  );

  return (
    <BridgeSync
      accounts={accounts}
      updateAccountWithUpdater={updateAccount}
      updateAllAccounts={updateAllAccounts}
      recoverError={recoverError}
      trackAnalytics={track}
      prepareCurrency={prepareCurrency}
      hydrateCurrency={hydrateCurrency}
      blacklistedTokenIds={blacklistedTokenIds}
      walletSyncAuth={walletSyncAuth}
      walletSyncVersionManager={walletSyncVersionManager}
      setLatestWalletSyncPayload={setLatestWalletSyncPayload}
      getLatestWalletSyncPayload={getLatestWalletSyncPayload}
    >
      {children}
    </BridgeSync>
  );
};
