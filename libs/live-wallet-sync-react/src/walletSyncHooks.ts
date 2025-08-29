import { TrustchainEjected, TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { resetTrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { CloudSyncSDK } from "@ledgerhq/live-wallet/cloudsync/index";
import {
  setWalletSyncError,
  setWalletSyncPending,
  walletSyncUpdate,
  WalletSyncUserState,
} from "@ledgerhq/live-wallet/store";
import walletsync, {
  Schema,
  liveSlug,
  makeLocalIncrementalUpdate,
  makeSaveNewUpdate,
  walletSyncWatchLoop,
} from "@ledgerhq/live-wallet/walletsync/index";
import type {
  BridgeCacheSystem,
  WalletSyncEnvironment,
  WalletSyncWatchConfig,
} from "@ledgerhq/types-live";
import { flow } from "lodash/fp";
import noop from "lodash/noop";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { useWalletSyncBridgeContext } from "./index";

/** Type matching the feature flag interface from @ledgerhq/types-live */
type FeatureData =
  | {
      enabled: boolean;
      params?: {
        environment?: WalletSyncEnvironment;
        watchConfig?: WalletSyncWatchConfig;
      };
    }
  | null
  | undefined;

type CommonOpts = {
  feature: FeatureData;
  bridgeCache: BridgeCacheSystem;
  blacklistedTokenIds?: string[];

  useTrustchainSdk: () => TrustchainSDK;
  useOnTrustchainRefreshNeeded: (
    sdk: TrustchainSDK,
    memberCreds: MemberCredentials | null,
  ) => (trustchain: Trustchain) => Promise<void>;
};

export function useCloudSyncSDK(
  opts: Pick<CommonOpts, "feature" | "bridgeCache" | "blacklistedTokenIds" | "useTrustchainSdk">,
): CloudSyncSDK<Schema> {
  const { cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(opts.feature?.params?.environment);
  const trustchainSdk = opts.useTrustchainSdk();
  const bridge = useWalletSyncBridgeContext();

  const ctx = useMemo(
    () => ({
      getAccountBridge,
      bridgeCache: opts.bridgeCache,
      blacklistedTokenIds: opts.blacklistedTokenIds ?? [],
    }),
    [opts.bridgeCache, opts.blacklistedTokenIds],
  );

  const getCurrentVersion = useCallback(() => bridge.getWalletSyncState().version, [bridge]);

  const saveNewUpdate = useMemo(
    () =>
      makeSaveNewUpdate({
        ctx,
        getState: () => ({
          accounts: bridge.getAccounts(),
          walletState: bridge.getWalletSyncState(),
        }),
        latestDistantStateSelector: () => bridge.getWalletSyncState().data,
        latestDistantVersionSelector: () => bridge.getWalletSyncState().version,
        localStateSelector: bridge.getLocalState,
        saveUpdate: bridge.saveUpdate,
      }),
    [bridge, ctx],
  );

  return useMemo(
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
}

export function useWatchWalletSync(
  opts: CommonOpts,
): WalletSyncUserState & { onUserRefresh: () => void } {
  const dispatch = useDispatch();
  const bridge = useWalletSyncBridgeContext();

  const memberCredentials = bridge.useMemberCredentials();
  const trustchain = bridge.useTrustchain();
  const trustchainSdk = opts.useTrustchainSdk();

  const walletSyncSdk = useCloudSyncSDK(opts);

  const onTrustchainRefreshNeeded = opts.useOnTrustchainRefreshNeeded(
    trustchainSdk,
    memberCredentials,
  );

  // Use Redux state instead of local state
  const userState = bridge.useStoredWalletSyncUserState();
  const onUserRefreshRef = useRef<() => void>(noop);

  // TODO onUserRefresh function identity never changes, but onUserRefreshRef.current can be updated silently.
  // This means consumers won't re-render when the actual refresh logic changes, potentially causing stale behavior.
  const onUserRefresh = useCallback(() => {
    onUserRefreshRef.current();
  }, []);

  const setVisualPending = useCallback(flow(setWalletSyncPending, dispatch), [dispatch]);
  const setWalletSyncErrorState = useCallback(flow(setWalletSyncError, dispatch), [dispatch]);

  const ctx = useMemo(
    () => ({
      getAccountBridge,
      bridgeCache: opts.bridgeCache,
      blacklistedTokenIds: opts.blacklistedTokenIds ?? [],
    }),
    [opts.bridgeCache, opts.blacklistedTokenIds],
  );

  const resetLedgerSync = useCallback(() => {
    dispatch(resetTrustchainStore());
    dispatch(walletSyncUpdate(null, 0));
  }, [dispatch]);

  useEffect(() => {
    if (userState.walletSyncError) {
      if (userState.walletSyncError instanceof TrustchainNotAllowed) resetLedgerSync();
      if (userState.walletSyncError instanceof TrustchainEjected) resetLedgerSync();
    }
  }, [userState.walletSyncError, resetLedgerSync]);

  useEffect(() => {
    const canNotRunWatchLoop = !opts.feature?.enabled || !trustchain || !memberCredentials;
    if (canNotRunWatchLoop) {
      onUserRefreshRef.current = noop;
      setVisualPending(false);
      setWalletSyncErrorState(null);
      return;
    }

    const localIncrementUpdate = makeLocalIncrementalUpdate({
      ctx,
      getState: () => ({
        accounts: bridge.getAccounts(),
        walletState: bridge.getWalletSyncState(),
      }),
      latestWalletStateSelector: () => bridge.getWalletSyncState(),
      localStateSelector: bridge.getLocalState,
      saveUpdate: bridge.saveUpdate,
    });

    const { unsubscribe, onUserRefreshIntent } = walletSyncWatchLoop({
      walletSyncSdk,
      watchConfig: opts.feature?.params?.watchConfig,
      localIncrementUpdate,
      trustchain,
      memberCredentials,
      setVisualPending,
      getState: () => ({
        accounts: bridge.getAccounts(),
        walletState: bridge.getWalletSyncState(),
      }),
      localStateSelector: bridge.getLocalState,
      latestDistantStateSelector: () => bridge.getWalletSyncState().data,
      onError: (e: unknown) =>
        setWalletSyncErrorState(e instanceof Error ? e : new Error(String(e))),
      onStartPolling: () => setWalletSyncErrorState(null),
      onTrustchainRefreshNeeded,
    });

    onUserRefreshRef.current = onUserRefreshIntent;
    return unsubscribe;
  }, [
    opts.feature?.enabled,
    opts.feature?.params?.watchConfig,
    trustchain,
    memberCredentials,
    bridge,
    walletSyncSdk,
    setVisualPending,
    setWalletSyncErrorState,
    onTrustchainRefreshNeeded,
    ctx,
  ]);

  return useMemo(
    () => ({
      visualPending: userState.visualPending,
      walletSyncError: userState.walletSyncError,
      onUserRefresh,
    }),
    [userState.visualPending, userState.walletSyncError, onUserRefresh],
  );
}
