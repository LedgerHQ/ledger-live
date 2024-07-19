import { z } from "zod";
import { ExtractLocalState, ExtractSchema, ExtractUpdateEvent } from "./types";
import { createAggregator } from "./aggregator";
import { createWalletSyncWatchLoop, VisualConfig, WatchConfig } from "./createWalletSyncWatchLoop";
export { createWalletSyncWatchLoop };
export type { VisualConfig, WatchConfig };
export { trustchainLifecycle } from "./trustchainLifecyle";
export * from "./incrementalUpdates";

// Maintain here the list of modules to aggregate for WalletSync data
// New modules can be added over time, it's also possible to remove modules but don't replace modules because the schema of a field must not change.

import accounts from "./modules/accounts";
import accountNames from "./modules/accountNames";
import { CloudSyncSDK } from "../cloudsync";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";

const modules = {
  accounts,
  accountNames,
};

////////////////////////////////////////////////////////////////////////

/**
 * This is the root WalletSyncDataManager that manage the data as a whole
 * for all the different fields and delegate/dispatch/aggregate the data
 * to each module.
 */
const root = createAggregator(modules);

type Root = typeof root;
export type LocalState = ExtractLocalState<Root>;
export type UpdateEvent = ExtractUpdateEvent<Root>;
export type Schema = ExtractSchema<Root>;
export type DistantState = z.infer<Schema>;

export default root;

export const liveSlug = "live";

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
