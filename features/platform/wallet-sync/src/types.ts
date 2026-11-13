import type { WalletSyncStateRoot } from "@domain/entity-wallet-sync";
import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { Dispatch, SerializedError } from "@reduxjs/toolkit";
import type { CloudSyncDataManager, DistantDocument } from "@shared/cloud-sync-module";
import type { ZodType } from "zod";
import type { WatchConfig } from "./createWalletSyncWatchLoop";

/**
 * What the middleware reads and writes in the store: the `@domain/entity-wallet-sync` slice, which
 * holds the last data synced, and the LKRP trustchain store, which it restores and resets.
 */
export type LedgerSyncStateRoot = WalletSyncStateRoot & { trustchain: TrustchainStore };

export interface LedgerSyncMiddlewareConfig<S extends LedgerSyncStateRoot, LocalState, Update> {
  /**
   * The watch loop runs while this flag is enabled, polling as its `watchConfig` says. Keep
   * `watchConfig` reference-stable: a new object, such as a `?? {}` fallback, restarts the loop.
   */
  featureSelector: (state: S) => { enabled?: boolean; watchConfig?: WatchConfig };
  /** What the LKRP SDK needs from the app: its backend, its instance name and its device access. */
  lkrp: {
    apiBaseUrl: string;
    /** A getter: the mobile Detox bridge resets the environment after the store is created. */
    isMockEnv: () => boolean;
    getInstanceName: () => string;
    withDevice: WithDevice;
  };
  /** What the Cloud Sync SDK needs from the app: its walletsync and its local state. */
  cloudSync: {
    apiBaseUrl: string;
    /** Memoized: a new walletsync, such as one for a new token blacklist, restarts the watch loop. */
    walletsyncSelector: (
      state: S,
    ) => CloudSyncDataManager<LocalState, Update, ZodType, DistantDocument>;
    localStateSelector: (state: S) => LocalState;
    /** Writes a local state that a sync brought in to the app's slices. */
    applyLocalState: (localState: LocalState, dispatch: Dispatch) => void;
    /** Re-encrypts the Cloud Sync data when removing a member rotates the trustchain key. */
    reencryptOnRotation?: boolean;
  };
}

/** What the Wallet Sync watch loop shows of its runs, under `state.ledgerSync`. */
export type LedgerSyncState = {
  /** A pull or a push has been running for longer than the visual pending timeout. */
  visualPending: boolean;
  /** The last error of the watch loop, cleared when the next poll starts. */
  walletSyncError: SerializedError | null;
};
