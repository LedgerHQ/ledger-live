import { TrustchainEjected, TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { CloudSyncSDK } from "@ledgerhq/live-wallet/cloudsync/index";
import { WalletSyncUserState } from "@ledgerhq/live-wallet/store";
import walletsync, {
  liveSlug,
  makeLocalIncrementalUpdate,
  makeSaveNewUpdate,
  Schema,
  walletSyncWatchLoop,
} from "@ledgerhq/live-wallet/walletsync/index";
import type {
  BridgeCacheSystem,
  WalletSyncEnvironment,
  WalletSyncWatchConfig,
} from "@ledgerhq/types-live";
import noop from "lodash/fp/noop";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useWalletSyncBridgeContext } from ".";

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
  resetLedgerSync: () => void;

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

  const onUserRefresh = useCallback(() => {
    onUserRefreshRef.current();
  }, []);

  // These are now provided by the bridge since they're platform-specific
  const setVisualPending = useCallback(
    (pending: boolean) => {
      bridge.setWalletSyncPending(pending);
    },
    [bridge],
  );

  const setWalletSyncErrorState = useCallback(
    (error: Error | null) => {
      bridge.setWalletSyncError(error);
    },
    [bridge],
  );

  const ctx = useMemo(
    () => ({
      getAccountBridge,
      bridgeCache: opts.bridgeCache,
      blacklistedTokenIds: opts.blacklistedTokenIds ?? [],
    }),
    [opts.bridgeCache, opts.blacklistedTokenIds],
  );

  const resetLedgerSync = opts.resetLedgerSync;

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
