import React, { useCallback, useMemo } from "react";
import { BridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector, useDispatch, useStore } from "react-redux";
import logger from "../logger";
import { updateAccountWithUpdater, updateAllAccountsWithUpdater } from "../actions/accounts";
import { accountsSelector } from "../reducers/accounts";
import { blacklistedTokenIdsSelector } from "../reducers/settings";
import { track } from "../analytics/segment";
import { prepareCurrency, hydrateCurrency } from "./cache";
import {
  walletSyncAuthSelector,
  walletSyncDescriptorsSelector,
  walletSyncVersionSelector,
} from "../reducers/walletsync";
import { setWalletSyncPayload, setVersion } from "../actions/walletsync";

export const BridgeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const dispatch = useDispatch();
  const updateAccount = useCallback(
    (accountId, updater) => dispatch(updateAccountWithUpdater({ accountId, updater })),
    [dispatch],
  );
  const updateAllAccounts = useCallback(
    updater => dispatch(updateAllAccountsWithUpdater({ updater })),
    [dispatch],
  );
  const recoverError = useCallback(error => {
    logger.critical(error);
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
      getLatestWalletSyncPayload={getLatestWalletSyncPayload}
      setLatestWalletSyncPayload={setLatestWalletSyncPayload}
    >
      {children}
    </BridgeSync>
  );
};
