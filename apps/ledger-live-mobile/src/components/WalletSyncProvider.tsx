import {
  WalletSyncProvider as BaseWalletSyncProvider,
  WalletSyncBridge,
} from "@ledgerhq/live-wallet-sync-react";
import {
  setAccountNames,
  setNonImportedAccounts,
  walletSyncStateSelector,
  walletSyncUpdate,
} from "@ledgerhq/live-wallet/store";
import { DistantState, LocalState } from "@ledgerhq/live-wallet/walletsync/index";
import React, { useCallback, useMemo } from "react";
import { useDispatch, useStore } from "react-redux";
import { replaceAccounts } from "~/actions/accounts";
import { useWalletSyncMobile } from "~/newArch/features/WalletSync/hooks/useWalletSyncMobile";
import { State } from "~/reducers/types";
import {
  useMemberCredentials,
  useTrustchain,
  useWalletSyncState,
  useWalletSyncUserState,
  walletSelector,
} from "~/reducers/wallet";

/** Create the mobile-specific bridge that connects wallet sync operations to Redux state */
export function useMobileWalletSyncBridge(): WalletSyncBridge {
  const dispatch = useDispatch();
  const store = useStore<State>();

  // Mobile uses { active: Account[] }
  const getAccounts = useCallback(() => store.getState().accounts.active, [store]);

  const getWalletSyncState = useCallback(() => {
    const state = store.getState();
    return walletSyncStateSelector(walletSelector(state));
  }, [store]);

  const getLocalState = useCallback((): LocalState => {
    const state = store.getState();
    return {
      accounts: {
        list: state.accounts.active, // Mobile uses { active: Account[] }
        nonImportedAccountInfos: state.wallet.nonImportedAccountInfos || [],
      },
      accountNames: state.wallet.accountNames || new Map(),
    };
  }, [store]);

  const saveUpdate = useCallback(
    async (data: DistantState | null, version: number, newLocalState: LocalState | null) => {
      try {
        // WRITE. save the state for the walletsync modules using reducer actions
        dispatch(walletSyncUpdate(data, version));
        if (newLocalState) {
          dispatch(setNonImportedAccounts(newLocalState.accounts.nonImportedAccountInfos));
          dispatch(setAccountNames(newLocalState.accountNames));
          dispatch(replaceAccounts(newLocalState.accounts.list)); // IMPORTANT: keep this one last, it's doing the DB:* trigger to save the data
        }
      } catch (error) {
        console.error("Failed to save wallet sync update:", error);
        throw error;
      }
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      getAccounts,
      getLocalState,
      getWalletSyncState,
      saveUpdate,
      useMemberCredentials,
      useTrustchain,
      useWalletSyncState,
      useWalletSyncUserState,
    }),
    [getAccounts, getWalletSyncState, getLocalState, saveUpdate],
  );
}

function Effect() {
  useWalletSyncMobile();
  return null;
}

/** Mobile-specific WalletSync Provider component that uses a shared redux state interface */
export function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  const bridge = useMobileWalletSyncBridge();

  return (
    <BaseWalletSyncProvider bridge={bridge}>
      <Effect />
      {children}
    </BaseWalletSyncProvider>
  );
}
