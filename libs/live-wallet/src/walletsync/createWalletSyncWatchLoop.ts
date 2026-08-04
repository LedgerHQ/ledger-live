import { ZodType, z } from "zod";
import {
  createWalletSyncWatchLoop as platformCreateWalletSyncWatchLoop,
  type CreateWalletSyncWatchLoopParams as PlatformParams,
} from "@features/platform-wallet-sync";
import { WalletSyncDataManager } from "./types";

export type { VisualConfig, WatchConfig } from "@features/platform-wallet-sync";

export type CreateWalletSyncWatchLoopParams<
  UserState,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> = Omit<
  PlatformParams<UserState, LocalState, Update, Schema, DistantState>,
  "walletsync" | "isTrustchainRefreshError"
> & {
  walletsync: WalletSyncDataManager<LocalState, Update, Schema>;
};

const isTrustchainRefreshError = (e: unknown): boolean => {
  const name = (e as { name?: string })?.name;
  return name === "TrustchainEjected" || name === "TrustchainOutdated";
};

/**
 * createWalletSyncWatchLoop is a helper to create a watch loop that will automatically sync the wallet with the cloud sync backend.
 * make sure to unsubscribe if you need to rerun a new watch loop. notably if one of the input changes.
 *
 * Deprecated: this only adapts the legacy ctx-carrying manager and the trustchain error
 * detection over @features/platform-wallet-sync, which holds the implementation.
 */
export function createWalletSyncWatchLoop<UserState, LocalState, Update, Schema extends ZodType>(
  params: CreateWalletSyncWatchLoopParams<UserState, LocalState, Update, Schema>,
): {
  onUserRefreshIntent: () => void;
  unsubscribe: () => void;
} {
  return platformCreateWalletSyncWatchLoop<UserState, LocalState, Update, Schema>({
    ...params,
    isTrustchainRefreshError,
  });
}
