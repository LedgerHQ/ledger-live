import { ZodType, z } from "zod";
import { CloudSyncSDKInterface, MemberCredentials, Trustchain } from "@shared/cloud-sync";
import { CloudSyncDataManager } from "@shared/cloud-sync-module";
import { runWatchLoop } from "../internals/watchLoop";
import type { VisualConfig, WatchConfig, WatchLoopHandle } from "../watchLoop/types";

/**
 * The watch loop on v1 trustchain objects, for callers that hold them. Its only caller is the
 * web-tools trustchain playground (`AppAccountsSync.tsx`), through the `./legacy` subpath. Each
 * cycle pulls, applies the local incremental update, then pushes the local diff. A
 * `TrustchainEjected` or `TrustchainOutdated` error calls `onTrustchainRefreshNeeded` instead of
 * `onError`. The apps use `useWalletSyncWatcher`, which never sees a key.
 *
 * @example
 * ```ts
 * const getState = store.getState;
 * const localIncrementUpdate = makeLocalIncrementalUpdate({
 *   walletsync,
 *   getState,
 *   latestWalletStateSelector,
 *   localStateSelector,
 *   saveUpdate,
 * });
 * const { onUserRefreshIntent, unsubscribe } = createWalletSyncWatchLoop({
 *   walletsync,
 *   walletSyncSdk,
 *   trustchain,
 *   memberCredentials,
 *   getState,
 *   localStateSelector,
 *   latestDistantStateSelector,
 *   localIncrementUpdate,
 *   onTrustchainRefreshNeeded: refreshTrustchain,
 * });
 * ```
 */
export function createWalletSyncWatchLoop<UserState, LocalState, Update, Schema extends ZodType>({
  walletSyncSdk,
  trustchain,
  memberCredentials,
  onTrustchainRefreshNeeded,
  ...rest
}: CreateWalletSyncWatchLoopParams<UserState, LocalState, Update, Schema>): WatchLoopHandle {
  return runWatchLoop({
    ...rest,
    transport: {
      pull() {
        return walletSyncSdk.pull(trustchain, memberCredentials);
      },
      push(nextState) {
        return walletSyncSdk.push(trustchain, memberCredentials, nextState);
      },
      listenNotifications() {
        return walletSyncSdk.listenNotifications(trustchain, memberCredentials);
      },
    },
    needsRefresh: isRotationOrEjection,
    onRefreshNeeded: () => onTrustchainRefreshNeeded(trustchain),
  });
}

/** Options of `createWalletSyncWatchLoop`. */
export type CreateWalletSyncWatchLoopParams<
  UserState,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> = {
  watchConfig?: WatchConfig;
  visualConfig?: VisualConfig;
  /** The data manager that resolves, applies and diffs the synced document. */
  walletsync: CloudSyncDataManager<LocalState, Update, Schema>;
  walletSyncSdk: CloudSyncSDKInterface<DistantState>;
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
  /** Called with true when a cycle outlasts the visual timeout, with false when it ends. */
  setVisualPending?: (b: boolean) => void;
  /** Called at the start of each cycle. */
  onStartPolling?: () => void;
  /** The trustchain rotated or this member was ejected: reload it or reset Ledger Sync. */
  onTrustchainRefreshNeeded: (trustchain: Trustchain) => Promise<void>;
  /** Any other cycle error. Without it the loop logs the error with `console.error`. */
  onError?: (e: unknown) => void;
  getState: () => UserState;
  localStateSelector: (state: UserState) => LocalState;
  latestDistantStateSelector: (state: UserState) => DistantState | null;
  /** Applies the last pulled document to the local state, usually `makeLocalIncrementalUpdate`. */
  localIncrementUpdate: () => Promise<void>;
};

function isRotationOrEjection(e: unknown): boolean {
  const eName = (e as { name?: string })?.name;
  return eName === "TrustchainEjected" || eName === "TrustchainOutdated";
}
