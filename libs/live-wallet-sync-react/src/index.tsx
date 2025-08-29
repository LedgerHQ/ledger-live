import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import type {
  StoredWalletSyncUserState,
  WalletSyncUserState,
  WSState,
} from "@ledgerhq/live-wallet/store";
import type { DistantState, LocalState } from "@ledgerhq/live-wallet/walletsync/root";
import type { Account } from "@ledgerhq/types-live";
import React, { createContext, ReactElement, useContext, useMemo } from "react";
import { useOnUserRefresh } from "./WalletSyncUserStateContext";

/**
 * Bridge enabling platform-specific persistence and access to wallet sync state.
 * Follows the CountervaluesBridge pattern - the library is completely agnostic
 * to platform state types and relies on the bridge for all state access.
 * @note Bridge object must be memoized to avoid re-renders.
 */
export interface WalletSyncBridge {
  /** Getter: returns all accounts, without subscribing. */
  getAccounts: () => Account[];

  /** Getter: returns current local wallet sync state. */
  getLocalState: () => LocalState;

  /** Getter: returns a snapshot of wallet sync state. */
  getWalletSyncState: () => WSState;

  /** Persist distant/local wallet sync updates into the store. */
  saveUpdate: (
    data: DistantState | null,
    version: number,
    newLocalState: LocalState | null,
  ) => Promise<void>;

  /** Hook: subscribes to member credentials, or null if none. */
  useMemberCredentials: () => MemberCredentials | null;

  /** Hook: returns raw stored wallet sync user state from the store. */
  useStoredWalletSyncUserState: () => StoredWalletSyncUserState;

  /** Hook: subscribes to Trustchain updates, or null if none. */
  useTrustchain: () => Trustchain | null;

  /** Hook: subscribes to wallet sync state updates. */
  useWalletSyncState: () => WSState;
}

export type Props = {
  /** Bridge enabling platform-specific persistence of wallet sync state */
  bridge: WalletSyncBridge;
  children: React.ReactNode;
};

/** Base WalletSync Context for state management */
export const WalletSyncContext = createContext<WalletSyncBridge | null>(null);

/** Hook to access the complete wallet sync bridge from components */
export function useWalletSyncBridgeContext(): WalletSyncBridge {
  const bridge = useContext(WalletSyncContext);
  if (!bridge) {
    throw new Error("'useWalletSyncBridgeContext' must be used within a 'WalletSyncProvider'");
  }
  return bridge;
}

/** Root wallet sync provider for state management */
export function WalletSyncProvider({ children, bridge }: Props): ReactElement {
  return <WalletSyncContext.Provider value={bridge}>{children}</WalletSyncContext.Provider>;
}

/** Returns the wallet sync state */
export function useWalletSyncState(): WSState {
  return useWalletSyncBridgeContext().useWalletSyncState();
}

/** Returns the trustchain */
export function useWalletSyncTrustchain(): Trustchain | null {
  return useWalletSyncBridgeContext().useTrustchain();
}

/** Returns the member credentials */
export function useWalletSyncMemberCredentials(): MemberCredentials | null {
  return useWalletSyncBridgeContext().useMemberCredentials();
}

/** Returns the save update function */
export function useWalletSyncSaveUpdate(): (
  data: DistantState | null,
  version: number,
  newLocalState: LocalState | null,
) => Promise<void> {
  return useWalletSyncBridgeContext().saveUpdate;
}

/** Returns the accounts getter function */
export function useWalletSyncAccounts(): () => Account[] {
  return useWalletSyncBridgeContext().getAccounts;
}

/** Returns the local state getter function */
export function useWalletSyncLocalState(): () => LocalState {
  return useWalletSyncBridgeContext().getLocalState;
}

/** Returns the wallet sync user state */
export function useWalletSyncUserState(): WalletSyncUserState {
  const storedState = useWalletSyncBridgeContext().useStoredWalletSyncUserState();
  const onUserRefresh = useOnUserRefresh();
  return useMemo(
    () => ({
      ...storedState,
      onUserRefresh,
    }),
    [storedState, onUserRefresh],
  );
}

/** Pure wallet sync hooks that accept data/params instead of reading feature flags internally */
export { useCloudSyncSDK, useWatchWalletSync } from "./walletSyncHooks";
