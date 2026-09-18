import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialWalletSyncState, type WalletSyncEnvironment, type WSState } from "./schema";

export const walletSyncSlice = createSlice({
  name: "walletSync",
  initialState: initialWalletSyncState,
  reducers: {
    walletSyncUpdate: (state, { payload }: PayloadAction<Pick<WSState, "data" | "version">>) => {
      state.walletSyncState.data = payload.data;
      state.walletSyncState.version = payload.version;
    },
    importWalletSyncState: (state, { payload }: PayloadAction<WSState>) => {
      state.walletSyncState = payload;
      state.isHydrated = true;
    },
    setWalletSyncStateHydrated: state => {
      state.isHydrated = true;
    },
    reconcileWalletSyncState: (
      state,
      { payload: environment }: PayloadAction<WalletSyncEnvironment>,
    ) => {
      if (!state.isHydrated) return;
      state.walletSyncState = reconcileCursorEnvironment(state.walletSyncState, environment);
    },
  },
});

export const {
  importWalletSyncState,
  reconcileWalletSyncState,
  setWalletSyncStateHydrated,
  walletSyncUpdate,
} = walletSyncSlice.actions;

function reconcileCursorEnvironment(cursor: WSState, environment: WalletSyncEnvironment): WSState {
  // Legacy case: no environment is linked to the cursor. Assume it comes from the active environment.
  if (typeof cursor.environment === "undefined") {
    return { ...cursor, environment: environment };
  }

  // The cursor does not match the active environment => reset the cursor
  if (cursor.environment !== environment) {
    return { data: null, version: 0, environment: environment };
  }

  return cursor;
}
