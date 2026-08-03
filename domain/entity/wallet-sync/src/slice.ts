import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { WalletSyncState } from "./schema";

export const walletSyncSlice = createSlice({
  name: "walletSync",
  initialState: {
    walletSyncState: { data: null, version: 0 },
  } as WalletSyncState,
  reducers: {
    walletSyncUpdate: (
      state,
      { payload }: PayloadAction<{ data: Record<string, unknown> | null; version: number }>,
    ) => {
      state.walletSyncState.data = payload.data;
      state.walletSyncState.version = payload.version;
    },
  },
});

export const { walletSyncUpdate } = walletSyncSlice.actions;
