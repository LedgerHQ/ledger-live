import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
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
import { walletSelector } from "~/renderer/reducers/wallet";
import {
  memberCredentialsSelector,
  resetTrustchainStore,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { State } from "~/renderer/reducers";
import { cache as bridgeCache } from "~/renderer/bridge/cache";
import {
  setAccountNames,
  setNonImportedAccounts,
  updateRecentAddresses,
  walletSyncStateSelector,
  walletSyncUpdate,
  WSState,
} from "@ledgerhq/live-wallet/store";
import { replaceAccounts } from "~/renderer/actions/accounts";
import {
  latestDistantStateSelector,
  latestDistantVersionSelector,
} from "~/renderer/reducers/wallet";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { Dispatch } from "redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { TrustchainEjected, TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";

const latestWalletStateSelector = (s: State): WSState => walletSyncStateSelector(walletSelector(s));

function localStateSelector(state: State): LocalState {
  // READ. connect the redux state to the walletsync modules
  return {
    accounts: {
      list: state.accounts,
      nonImportedAccountInfos: state.wallet.nonImportedAccountInfos,
    },
    accountNames: state.wallet.accountNames,
    recentAddresses: state.wallet.recentAddresses,
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
    dispatch(updateRecentAddresses(newLocalState.recentAddresses));
    dispatch(replaceAccounts(newLocalState.accounts.list)); // triggers db middleware to persist accounts
  }
}

const ctx = { getAccountBridge, bridgeCache, blacklistedTokenIds: [] };

export function useCloudSyncSDK(): CloudSyncSDK<Schema> {
  const featureWalletSync = useFeature("lldWalletSync");
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
        latestDistantVersionSelector,
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
  const featureWalletSync = useFeature("lldWalletSync");
  const dispatch = useDispatch();
  const saveUpdate = useSaveUpdate();
  const getState = useGetState();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const trustchain = useSelector(trustchainSelector);
  const trustchainSdk = useTrustchainSdk();
  const walletSyncSdk = useCloudSyncSDK();
  const onTrustchainRefreshNeeded = useOnTrustchainRefreshNeeded(trustchainSdk, memberCredentials);

  const [visualPending, setVisualPending] = useState(true);
  const [walletSyncError, setWalletSyncError] = useState<Error | null>(null);
  const onUserRefreshRef = useRef<() => void>(noop);
  const state = useMemo(
    () => ({ visualPending, walletSyncError, onUserRefresh: onUserRefreshRef.current }),
    [visualPending, walletSyncError],
  );

  const resetLedgerSync = useCallback(() => {
    dispatch(resetTrustchainStore());
    dispatch(walletSyncUpdate(null, 0));
  }, [dispatch]);

  useEffect(() => {
    if (walletSyncError) {
      if (walletSyncError instanceof TrustchainNotAllowed) resetLedgerSync();
      if (walletSyncError instanceof TrustchainEjected) resetLedgerSync();
    }
  }, [dispatch, resetLedgerSync, walletSyncError]);

  // pull and push wallet sync loop
  useEffect(() => {
    const canNotRunWatchLoop = !featureWalletSync?.enabled || !trustchain || !memberCredentials;
    if (canNotRunWatchLoop) {
      onUserRefreshRef.current = noop;
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

    onUserRefreshRef.current = onUserRefreshIntent;

    return unsubscribe;
  }, [
    getState,
    trustchainSdk,
    walletSyncSdk,
    trustchain,
    memberCredentials,
    onTrustchainRefreshNeeded,
    saveUpdate,
    featureWalletSync,
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
