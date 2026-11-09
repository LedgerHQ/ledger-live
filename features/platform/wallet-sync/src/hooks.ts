import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  refreshLedgerSync,
  selectLedgerSyncError,
  selectLedgerSyncVisualPending,
  startLedgerSyncWatch,
  stopLedgerSyncWatch,
} from "./watch";

/**
 * Runs the Ledger Sync middleware's Wallet Sync watch loop while the caller is mounted. Mount it
 * once, at the app root: the first caller to unmount stops the watch for every other one.
 */
export function useLedgerSyncWatch() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(startLedgerSyncWatch());
    return () => {
      dispatch(stopLedgerSyncWatch());
    };
  }, [dispatch]);
}

/** What the user sees of the watch loop, and how they ask it for an early sync. */
export function useWalletSyncUserState() {
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
