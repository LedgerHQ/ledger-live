import {
  memberCredentialsSelector,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
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
import { useWalletSyncDesktop } from "LLD/features/WalletSync/hooks/useWalletSyncDesktop";
import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { replaceAccounts } from "../actions/accounts";
import { setWalletSyncPending, setWalletSyncError } from "../actions/walletSyncUserState";
import { State } from "../reducers";
import { walletSelector } from "../reducers/wallet";

const useTrustchain = () => useSelector((s: State) => trustchainSelector(s));
const useMemberCredentials = () => useSelector((s: State) => memberCredentialsSelector(s));
const useStoredWalletSyncUserState = () => useSelector((s: State) => s.walletSyncUserState);
const useWalletSyncState = () =>
  useSelector((s: State) => walletSyncStateSelector(walletSelector(s)));

/** Create the desktop-specific bridge that connects wallet sync operations to Redux state */
export function useDesktopWalletSyncBridge(): WalletSyncBridge {
  const dispatch = useDispatch();
  const store = useStore<State>();

  // Desktop uses Account[] directly
  const getAccounts = useCallback(() => store.getState().accounts, [store]);

  const getWalletSyncState = useCallback(() => {
    const state = store.getState();
    return walletSyncStateSelector(walletSelector(state));
  }, [store]);

  const getLocalState = useCallback((): LocalState => {
    const state = store.getState();
    return {
      accounts: {
        list: state.accounts,
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

  const setWalletSyncPendingAction = useCallback(
    (pending: boolean) => {
      dispatch(setWalletSyncPending(pending));
    },
    [dispatch],
  );

  const setWalletSyncErrorAction = useCallback(
    (error: Error | null) => {
      dispatch(setWalletSyncError(error));
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
      useStoredWalletSyncUserState,
      setWalletSyncPending: setWalletSyncPendingAction,
      setWalletSyncError: setWalletSyncErrorAction,
    }),
    [
      getAccounts,
      getWalletSyncState,
      getLocalState,
      saveUpdate,
      setWalletSyncPendingAction,
      setWalletSyncErrorAction,
    ],
  );
}

function Effect() {
  useWalletSyncDesktop();
  return null;
}

/** Desktop-specific WalletSync Provider component that uses a shared redux state interface */
export function WalletSyncProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const bridge = useDesktopWalletSyncBridge();

  return (
    <BaseWalletSyncProvider bridge={bridge}>
      <Effect />
      {children}
    </BaseWalletSyncProvider>
  );
}
