import { createAction, createSelector } from "@reduxjs/toolkit";
import { ledgerSyncSlice } from "./internals/watch";
import type { LedgerSyncState } from "./types";

export const ledgerSyncReducer = ledgerSyncSlice.reducer;
export const ledgerSyncInitialState: LedgerSyncState = ledgerSyncSlice.getInitialState();

/**
 * Runs the Wallet Sync watch loop of the store's Ledger Sync middleware from now on, while the
 * feature is enabled and the store holds a trustchain and member credentials.
 */
export const startLedgerSyncWatch = createAction("ledgerSync/startWatch");
export const stopLedgerSyncWatch = createAction("ledgerSync/stopWatch");
/** Asks the running watch loop to pull and push soon, as a user refresh does. */
export const refreshLedgerSync = createAction("ledgerSync/refresh");

export const selectLedgerSyncVisualPending = (state: { ledgerSync: LedgerSyncState }) =>
  state.ledgerSync.visualPending;
/** The last error of the watch loop, rebuilt from the name and message the slice keeps. */
export const selectLedgerSyncError = createSelector(
  [(state: { ledgerSync: LedgerSyncState }) => state.ledgerSync.walletSyncError],
  error => error && Object.assign(new Error(error.message), { name: error.name ?? "Error" }),
);
