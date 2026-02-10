import { createSlice } from "@reduxjs/toolkit";
import type { State } from "~/renderer/reducers";

export type ZcashSyncState = {
  startSyncNonce: number;
  syncState: "disabled" | "ready" | "running" | "paused" | "complete" | "outdated";
};

const initialState: ZcashSyncState = {
  startSyncNonce: 0,
  syncState: "disabled",
};

const zcashSyncSlice = createSlice({
  name: "zcashSync",
  initialState,
  reducers: {
    startZcashSync: state => {
      state.startSyncNonce += 1;
    },
    readyZcashSync: state => {
      state.syncState = "ready";
    },
  },
});

export const { startZcashSync, readyZcashSync } = zcashSyncSlice.actions;

export const zcashSyncStartNonceSelector = (state: State): ZcashSyncState["startSyncNonce"] =>
  state.zcashSync.startSyncNonce;

export const zcashSyncStateSelector = (state: State): ZcashSyncState["syncState"] =>
  state.zcashSync.syncState;

export default zcashSyncSlice.reducer;
