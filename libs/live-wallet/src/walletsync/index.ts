import { createWalletSyncWatchLoop, VisualConfig, WatchConfig } from "./createWalletSyncWatchLoop";
import { CloudSyncSDK } from "../cloudsync";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import root, { DistantState, LocalState, Schema } from "./root";

export {
  createWalletSyncWatchLoop,
  type VisualConfig,
  type WatchConfig,
} from "./createWalletSyncWatchLoop";
export * from "./trustchainLifecyle";
export * from "./incrementalUpdates";
export * from "./root";
export { default } from "./root";

/**
 * specialized version of createWalletSyncWatchLoop for the root WalletSyncDataManager.
 * UserState is the global state of the application that you have. (LLD/LLM/webtools all have different states)
 * Refer to createWalletSyncWatchLoop for more information.
 */
export function walletSyncWatchLoop<UserState>({
  watchConfig,
  visualConfig,
  walletSyncSdk,
  trustchain,
  memberCredentials,
  setVisualPending,
  onError,
  onStartPolling,
  getState,
  localStateSelector,
  latestDistantStateSelector,
  onTrustchainRefreshNeeded,
  localIncrementUpdate,
}: {
  watchConfig?: WatchConfig;
  visualConfig?: VisualConfig;
  walletSyncSdk: CloudSyncSDK<Schema>;
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
  setVisualPending: (b: boolean) => void;
  onTrustchainRefreshNeeded: (trustchain: Trustchain) => Promise<void>;
  onError?: (e: unknown) => void;
  onStartPolling?: () => void;
  getState: () => UserState;
  localStateSelector: (state: UserState) => LocalState;
  latestDistantStateSelector: (state: UserState) => DistantState | null;
  localIncrementUpdate: () => Promise<void>;
}) {
  const walletsync = root;
  return createWalletSyncWatchLoop({
    watchConfig,
    visualConfig,
    walletsync,
    walletSyncSdk,
    trustchain,
    memberCredentials,
    setVisualPending,
    onError,
    onStartPolling,
    getState,
    localStateSelector,
    latestDistantStateSelector,
    onTrustchainRefreshNeeded,
    localIncrementUpdate,
  });
}
