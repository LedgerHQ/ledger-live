import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import noop from "lodash/noop";
import { CloudSyncSDK } from "@shared/cloud-sync";
import {
  createWalletSyncWatchLoop,
  liveSlug,
  makeSaveNewUpdate,
  makeLocalIncrementalUpdate,
} from "@features/platform-wallet-sync";
import { bulkSetAccountNames } from "@domain/entity-account-name";
import { updateRecentAddresses } from "@domain/entity-recent-addresses";
import { setNonImportedAccounts } from "@ledgerhq/live-wallet/accounts";
import {
  createWalletsync,
  type CloudSyncModuleQuarantined,
  type Walletsync,
  type DistantDocument,
  type WalletSyncLocalState,
} from "@ledgerhq/live-wallet/walletSyncComposition";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { cache as bridgeCache } from "~/renderer/bridge/cache";
import {
  walletSelector,
  latestDistantStateSelector,
  latestDistantVersionSelector,
} from "~/renderer/reducers/wallet";
import {
  memberCredentialsSelector,
  resetTrustchainStore,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { State } from "~/renderer/reducers";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { Dispatch } from "redux";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import logger from "~/renderer/logger";

type DistantState = DistantDocument;
type LocalState = WalletSyncLocalState;

function onModuleError(moduleKey: string, error: CloudSyncModuleQuarantined) {
  logger.critical(error, `cloud-sync module ${moduleKey} quarantined`);
}

function useWalletsync(): Walletsync {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  return useMemo(
    () =>
      createWalletsync({ getAccountBridge, bridgeCache, blacklistedTokenIds }, { onModuleError }),
    [blacklistedTokenIds],
  );
}

function latestWalletStateSelector(s: State): { data: DistantState | null; version: number } {
  const ws = walletSelector(s).walletSync.walletSyncState;
  return {
    data: ws.data,
    version: ws.version,
  };
}

function localStateSelector(state: State): LocalState {
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
  dispatch(walletSyncUpdate({ data, version }));
  if (newLocalState) {
    dispatch(setNonImportedAccounts(newLocalState.accounts.nonImportedAccountInfos));
    dispatch(bulkSetAccountNames(newLocalState.accountNames));
    dispatch(updateRecentAddresses(newLocalState.recentAddresses));
    dispatch(replaceAccounts(newLocalState.accounts.list));
  }
}

export function useCloudSyncSDK(): CloudSyncSDK<DistantState> {
  const featureWalletSync = useFeature("lldWalletSync");
  const { cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const trustchainSdk = useTrustchainSdk();
  const walletsync = useWalletsync();
  const getState = useGetState();
  const getCurrentVersion = useCallback(() => latestDistantVersionSelector(getState()), [getState]);
  const saveUpdate = useSaveUpdate();

  const saveNewUpdate = useMemo(
    () =>
      makeSaveNewUpdate({
        walletsync,
        getState,
        latestDistantStateSelector,
        latestDistantVersionSelector,
        localStateSelector,
        saveUpdate,
      }),
    [walletsync, getState, saveUpdate],
  );

  const cloudSyncSDK = useMemo(
    () =>
      new CloudSyncSDK({
        apiBaseUrl: cloudSyncApiBaseUrl,
        slug: liveSlug,
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
  const walletsync = useWalletsync();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const trustchain = useSelector(trustchainSelector);
  const trustchainSdk = useTrustchainSdk();
  const walletSyncSdk = useCloudSyncSDK();
  const onTrustchainRefreshNeeded = useOnTrustchainRefreshNeeded(trustchainSdk, memberCredentials);

  const [visualPending, setVisualPending] = useState(true);
  const [walletSyncError, setWalletSyncError] = useState<Error | null>(null);
  const onUserRefreshRef = useRef<() => void>(noop);
  const state = useMemo(
    () => ({
      visualPending,
      walletSyncError,
      onUserRefresh: onUserRefreshRef.current,
    }),
    [visualPending, walletSyncError],
  );

  const resetLedgerSync = useCallback(() => {
    dispatch(resetTrustchainStore());
    dispatch(walletSyncUpdate({ data: null, version: 0 }));
  }, [dispatch]);

  useEffect(() => {
    if (walletSyncError) {
      if (walletSyncError?.name === "TrustchainNotAllowed") resetLedgerSync();
      if (walletSyncError?.name === "TrustchainEjected") resetLedgerSync();
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
      walletsync,
      getState,
      latestWalletStateSelector,
      localStateSelector,
      saveUpdate,
    });

    const { unsubscribe, onUserRefreshIntent } = createWalletSyncWatchLoop({
      walletsync,
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
    walletsync,
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
