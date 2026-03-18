import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Stores sync-related UI state that must survive component remounts within a session:
 * - lastUserSyncClickTimestamp: differentiates manual vs auto refresh loading.
 * - hasCompletedInitialSync: tracks whether the first sync cycle after app start finished.
 *   Resets on app restart (not persisted to disk).
 */
export type SyncRefreshState = {
  lastUserSyncClickTimestamp: number;
  hasCompletedInitialSync: boolean;
};

const initialState: SyncRefreshState = {
  lastUserSyncClickTimestamp: 0,
  hasCompletedInitialSync: false,
};

const syncRefreshSlice = createSlice({
  name: "syncRefresh",
  initialState,
  reducers: {
    setLastUserSyncClickTimestamp: (state, action: PayloadAction<number>) => {
      state.lastUserSyncClickTimestamp = action.payload;
    },
    setHasCompletedInitialSync: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedInitialSync = action.payload;
    },
  },
});

export const { setLastUserSyncClickTimestamp, setHasCompletedInitialSync } =
  syncRefreshSlice.actions;

/** Select last user sync click timestamp from state (0 = never). */
export const selectLastUserSyncClickTimestamp = (state: { syncRefresh: SyncRefreshState }) =>
  state.syncRefresh.lastUserSyncClickTimestamp;

export const selectHasCompletedInitialSync = (state: { syncRefresh: SyncRefreshState }) =>
  state.syncRefresh.hasCompletedInitialSync;

export default syncRefreshSlice.reducer;
