import React, { useCallback, useEffect, useMemo } from "react";
import {
  refreshLedgerSync,
  selectLedgerSyncError,
  selectLedgerSyncVisualPending,
  startLedgerSyncWatch,
  stopLedgerSyncWatch,
} from "@features/platform-wallet-sync";
import type { WalletSyncUserState } from "@ledgerhq/live-common/bridge/react/index";
import { useDispatch, useSelector } from "~/context/hooks";

/** Runs the Wallet Sync watch loop of the store's Ledger Sync middleware while it is mounted. */
export function WalletSyncProvider({ children }: { children?: React.ReactNode }) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(startLedgerSyncWatch());
    return () => {
      dispatch(stopLedgerSyncWatch());
    };
  }, [dispatch]);
  return <>{children}</>;
}

export function useWalletSyncUserState(): WalletSyncUserState {
  const dispatch = useDispatch();
  const visualPending = useSelector(selectLedgerSyncVisualPending);
  const walletSyncError = useSelector(selectLedgerSyncError);
  const onUserRefresh = useCallback(() => {
    dispatch(refreshLedgerSync());
  }, [dispatch]);
  return useMemo(
    () => ({ visualPending, walletSyncError, onUserRefresh }),
    [visualPending, walletSyncError, onUserRefresh],
  );
}
