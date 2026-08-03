import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialWalletSyncState, type WSState } from "./schema";

export const walletSyncSlice = createSlice({
  name: "walletSync",
  initialState: initialWalletSyncState,
  reducers: {
    walletSyncUpdate: (state, { payload }: PayloadAction<WSState>) => {
      state.walletSyncState.data = payload.data;
      state.walletSyncState.version = payload.version;
    },
  },
});

export const { walletSyncUpdate } = walletSyncSlice.actions;
