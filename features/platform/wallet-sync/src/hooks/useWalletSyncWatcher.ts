import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ZodType, z } from "zod";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import { walletSyncUpdate } from "@domain/entity-wallet-sync";
import {
  classifyKeyRingError,
  resetKeyRingState,
  type KeyRingClient,
  type KeyRingDispatch,
  type KeyRingSession,
} from "@features/platform-key-ring";
import type { WatchConfig } from "../watchLoop/types";
import type { KeyRingCloudSync } from "../cloudSync/keyRingCloudSync";
import { makeLocalIncrementalUpdate } from "../watchLoop/incrementalUpdates";
import { createKeyRingWatchLoop } from "../internals/keyRingWatchLoop";

/**
 * Runs the watch loop both apps share: pulls and pushes the Ledger Wallet document while the flag
 * is enabled and the session opens a stream, that is while this instance is a Ledger Sync member.
 * An error classified `outdated` or `member-removed` calls `onRefreshNeeded` instead of being
 * reported; a reported `not-allowed` or `member-removed` error resets the key ring state and the
 * saved document. Any port that changes identity restarts the loop, so pass module-level
 * selectors and memoized callbacks.
 *
 * @example
 * ```ts
 * // Module level: a new selector on each render would restart the loop.
 * function localStateSelector(state: State): WalletSyncLocalState { ... }
 * function latestWalletStateSelector(state: State) { ... }
 *
 * export function useWatchWalletSync(): WalletSyncUserState {
 *   const keyRing = useTrustchainSdk();
 *   return useWalletSyncWatcher({
 *     walletSyncFeature: useFeature("lldWalletSync"),
 *     keyRing,
 *     session: useSelector(selectKeyRingSession),
 *     cloudSync: useCloudSyncSDK(),
 *     walletsync: useWalletsync(),
 *     getState: useGetState(),
 *     dispatch: useDispatch(),
 *     localStateSelector,
 *     latestDistantStateSelector,
 *     latestWalletStateSelector,
 *     saveUpdate: useSaveUpdate(),
 *     onRefreshNeeded: useOnTrustchainRefreshNeeded(keyRing),
 *   });
 * }
 * ```
 */
export function useWalletSyncWatcher<
  State,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
>({
  walletSyncFeature,
  keyRing,
  session,
  cloudSync,
  walletsync,
  getState,
  dispatch,
  localStateSelector,
  latestDistantStateSelector,
  latestWalletStateSelector,
  saveUpdate,
  onRefreshNeeded,
}: WalletSyncWatcherPorts<State, LocalState, Update, Schema, DistantState>): WalletSyncUserState {
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
    dispatch(resetKeyRingState());
    dispatch(walletSyncUpdate({ data: null, version: 0 }));
  }, [dispatch]);

  useEffect(() => {
    if (!walletSyncError) return;
    const category = classifyKeyRingError(walletSyncError);
    if (category === "not-allowed" || category === "member-removed") resetLedgerSync();
  }, [resetLedgerSync, walletSyncError]);

  useEffect(() => {
    const stream = walletSyncFeature?.enabled ? keyRing.openStream(session) : null;
    if (!stream) {
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

    const { unsubscribe, onUserRefreshIntent } = createKeyRingWatchLoop({
      walletsync,
      cloudSync,
      stream,
      watchConfig: walletSyncFeature?.params?.watchConfig,
      localIncrementUpdate,
      setVisualPending,
      getState,
      localStateSelector,
      latestDistantStateSelector,
      onError: e => setWalletSyncError(e && e instanceof Error ? e : new Error(String(e))),
      onStartPolling: () => setWalletSyncError(null),
      onRefreshNeeded: () => onRefreshNeeded(session),
    });

    onUserRefreshRef.current = onUserRefreshIntent;

    return unsubscribe;
  }, [
    walletSyncFeature,
    keyRing,
    session,
    cloudSync,
    walletsync,
    getState,
    localStateSelector,
    latestDistantStateSelector,
    latestWalletStateSelector,
    saveUpdate,
    onRefreshNeeded,
  ]);

  return state;
}

/** What the app shows of the watch loop. */
export type WalletSyncUserState = {
  /** A cycle is running longer than the visual timeout. */
  visualPending: boolean;
  /** The error of the last cycle, cleared when the next one starts. */
  walletSyncError: Error | null;
  /** Runs a cycle soon instead of waiting for the next poll. No-op while the loop is off. */
  onUserRefresh: () => void;
};

/** The app's Ledger Sync feature flag: a new value restarts the loop. */
export type WalletSyncFeature =
  | Readonly<{ enabled?: boolean; params?: Readonly<{ watchConfig?: WatchConfig }> | null }>
  | null
  | undefined;

/** What `useWalletSyncWatcher` needs from the app. Every port must keep its identity. */
export type WalletSyncWatcherPorts<
  State,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> = Readonly<{
  /** The app's feature flag object as `useFeature` returns it. */
  walletSyncFeature: WalletSyncFeature;
  /** The app's key ring client: opens the stream of the session. */
  keyRing: KeyRingClient;
  /** From `useSelector(selectKeyRingSession)`. */
  session: KeyRingSession;
  /** From `useKeyRingCloudSync`. */
  cloudSync: KeyRingCloudSync<DistantState>;
  /** The app's data manager, from `createWalletsync` in live-wallet. */
  walletsync: CloudSyncDataManager<LocalState, Update, Schema, DistantState>;
  /** Reads the current store state, not a render snapshot. */
  getState: () => State;
  /**
   * Receives the reset actions when this instance is removed or not allowed: the store dispatch,
   * whose thunk `extraArgument` holds the key ring runtime the reset thunk reads.
   */
  dispatch: KeyRingDispatch;
  /** Module-level selectors: a new function on each render would restart the loop. */
  localStateSelector: (state: State) => LocalState;
  latestDistantStateSelector: (state: State) => DistantState | null;
  latestWalletStateSelector: (state: State) => { data: DistantState | null; version: number };
  /** Dispatches the saved document and, when not null, the new local state. */
  saveUpdate: (
    data: DistantState | null,
    version: number,
    newLocalState: LocalState | null,
  ) => Promise<void>;
  /** The key changed or this instance may have left: reload the key tree or reset. */
  onRefreshNeeded: (session: KeyRingSession) => Promise<void>;
}>;

function noop() {}
