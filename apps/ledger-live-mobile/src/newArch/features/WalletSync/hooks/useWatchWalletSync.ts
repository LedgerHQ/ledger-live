import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import noop from "lodash/noop";
import { CloudSyncSDK } from "@ledgerhq/live-wallet/cloudsync/index";
import walletsync, {
  liveSlug,
  DistantState,
  walletSyncWatchLoop,
  LocalState,
  Schema,
  makeSaveNewUpdate,
  makeLocalIncrementalUpdate,
} from "@ledgerhq/live-wallet/walletsync/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { memberCredentialsSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import {
  setAccountNames,
  setNonImportedAccounts,
  walletSyncStateSelector,
  walletSyncUpdate,
  WSState,
} from "@ledgerhq/live-wallet/store";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { Dispatch } from "redux";
import { walletSelector } from "~/reducers/wallet";
import { State } from "~/reducers/types";
import { bridgeCache } from "~/bridge/cache";
import { replaceAccounts } from "~/actions/accounts";
import { latestDistantStateSelector } from "~/reducers/wallet";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

const latestWalletStateSelector = (s: State): WSState => walletSyncStateSelector(walletSelector(s));

function localStateSelector(state: State): LocalState {
  // READ. connect the redux state to the walletsync modules
  return {
    accounts: {
      list: state.accounts.active,
      nonImportedAccountInfos: state.wallet.nonImportedAccountInfos,
    },
    accountNames: state.wallet.accountNames,
  };
}

async function save(
  data: DistantState | null,
  version: number,
  newLocalState: LocalState | null,
  dispatch: Dispatch,
) {
  // WRITE. save the state for the walletsync modules
  dispatch(walletSyncUpdate(data, version));
  if (newLocalState) {
    dispatch(setNonImportedAccounts(newLocalState.accounts.nonImportedAccountInfos));
    dispatch(setAccountNames(newLocalState.accountNames));
    dispatch(replaceAccounts(newLocalState.accounts.list)); // IMPORTANT: keep this one last, it's doing the DB:* trigger to save the data
  }
}

const ctx = { getAccountBridge, bridgeCache, blacklistedTokenIds: [] };

export function useCloudSyncSDK(): CloudSyncSDK<Schema> {
  const featureWalletSync = useFeature("llmWalletSync");
  const { cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const trustchainSdk = useTrustchainSdk();
  const getState = useGetState();
  const getCurrentVersion = useCallback(
    () => latestWalletStateSelector(getState()).version,
    [getState],
  );
  const saveUpdate = useSaveUpdate();

  const saveNewUpdate = useMemo(
    () =>
      makeSaveNewUpdate({
        ctx,
        getState,
        latestDistantStateSelector,
        localStateSelector,
        saveUpdate,
      }),
    [getState, saveUpdate],
  );

  const cloudSyncSDK = useMemo(
    () =>
      new CloudSyncSDK({
        apiBaseUrl: cloudSyncApiBaseUrl,
        slug: liveSlug,
        schema: walletsync.schema,
        trustchainSdk,
        getCurrentVersion,
        saveNewUpdate,
      }),
    [cloudSyncApiBaseUrl, trustchainSdk, getCurrentVersion, saveNewUpdate],
  );

  return cloudSyncSDK;
}

export type WalletSyncUserState = {
  visualPending: boolean;
  walletSyncError: Error | null;
  onUserRefresh: () => void;
};

export function useWatchWalletSync(): WalletSyncUserState {
  const featureWalletSync = useFeature("llmWalletSync");
  const saveUpdate = useSaveUpdate();
  const getState = useGetState();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const trustchain = useSelector(trustchainSelector);
  const trustchainSdk = useTrustchainSdk();
  const walletSyncSdk = useCloudSyncSDK();
  const onTrustchainRefreshNeeded = useOnTrustchainRefreshNeeded(trustchainSdk, memberCredentials);

  const [visualPending, setVisualPending] = useState(true);
  const [walletSyncError, setWalletSyncError] = useState<Error | null>(null);
  const [onUserRefresh, setOnUserRefresh] = useState<() => void>(() => noop);
  const state = useMemo(
    () => ({ visualPending, walletSyncError, onUserRefresh }),
    [visualPending, walletSyncError, onUserRefresh],
  );

  // pull and push wallet sync loop
  useEffect(() => {
    const canNotRunWatchLoop = !featureWalletSync?.enabled || !trustchain || !memberCredentials;

    if (canNotRunWatchLoop) {
      setOnUserRefresh(() => noop);
      setVisualPending(false);
      setWalletSyncError(null);
      return;
    }

    const localIncrementUpdate = makeLocalIncrementalUpdate({
      ctx,
      getState,
      latestWalletStateSelector,
      localStateSelector,
      saveUpdate,
    });

    const { unsubscribe, onUserRefreshIntent } = walletSyncWatchLoop({
      walletSyncSdk,
      watchConfig: featureWalletSync?.params?.watchConfig,
      localIncrementUpdate,
      trustchain,
      memberCredentials,
      setVisualPending,
      getState,
      localStateSelector,
      latestDistantStateSelector,
      onError: e => setWalletSyncError(e && e instanceof Error ? e : new Error(String(e))),
      onStartPolling: () => setWalletSyncError(null),
      onTrustchainRefreshNeeded,
    });

    setOnUserRefresh(() => onUserRefreshIntent);

    return unsubscribe;
  }, [
    featureWalletSync,
    getState,
    trustchainSdk,
    walletSyncSdk,
    trustchain,
    memberCredentials,
    onTrustchainRefreshNeeded,
    saveUpdate,
  ]);

  return state;
}

function useSaveUpdate() {
  const dispatch = useDispatch();
  return useCallback(
    (data: DistantState | null, version: number, newLocalState: LocalState | null) =>
      save(data, version, newLocalState, dispatch),
    [dispatch],
  );
}

function useGetState() {
  const store = useStore();
  return useCallback(() => store.getState(), [store]);
}
