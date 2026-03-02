import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Stores the timestamp of the last user-triggered sync (TopBar sync button click).
 * Used to differentiate manual vs auto refresh loading so the Balance can show
 * loading (shimmer) only on cold start or after user click, not during background sync.
 */
export type SyncRefreshState = {
  lastUserSyncClickTimestamp: number;
};

const initialState: SyncRefreshState = {
  lastUserSyncClickTimestamp: 0,
};

const syncRefreshSlice = createSlice({
  name: "syncRefresh",
  initialState,
  reducers: {
    setLastUserSyncClickTimestamp: (state, action: PayloadAction<number>) => {
      state.lastUserSyncClickTimestamp = action.payload;
    },
  },
});

export const { setLastUserSyncClickTimestamp } = syncRefreshSlice.actions;

/** Select last user sync click timestamp from state (0 = never). */
export const selectLastUserSyncClickTimestamp = (state: { syncRefresh: SyncRefreshState }) =>
  state.syncRefresh.lastUserSyncClickTimestamp;

export default syncRefreshSlice.reducer;
