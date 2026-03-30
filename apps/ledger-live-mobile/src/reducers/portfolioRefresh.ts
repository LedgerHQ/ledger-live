import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createSelector } from "~/context/selectors";
import { State } from "~/reducers/types";

export interface PortfolioRefreshState {
  isRefreshing: boolean;
  lastSyncTimestampSnapshot: number | null;
  hasCompletedInitialSync: boolean;
  lastUserSyncClickTimestamp: number;
  lastOfflineRefreshAttemptTimestamp: number;
}

export const INITIAL_STATE: PortfolioRefreshState = {
  isRefreshing: false,
  lastSyncTimestampSnapshot: null,
  hasCompletedInitialSync: false,
  lastUserSyncClickTimestamp: 0,
  lastOfflineRefreshAttemptTimestamp: 0,
};

const portfolioRefreshSlice = createSlice({
  name: "portfolioRefresh",
  initialState: INITIAL_STATE,
  reducers: {
    setRefreshStarted: (state, action: PayloadAction<number | null>) => {
      state.isRefreshing = true;
      state.lastSyncTimestampSnapshot = action.payload;
    },
    setRefreshCompleted: state => {
      state.isRefreshing = false;
      state.lastSyncTimestampSnapshot = null;
    },
    setHasCompletedInitialSync: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedInitialSync = action.payload;
    },
    setLastUserSyncClickTimestamp: (state, action: PayloadAction<number>) => {
      state.lastUserSyncClickTimestamp = action.payload;
    },
    setOfflineRefreshAttempt: (state, action: PayloadAction<number>) => {
      state.lastOfflineRefreshAttemptTimestamp = action.payload;
    },
  },
});

export const {
  setRefreshStarted,
  setRefreshCompleted,
  setHasCompletedInitialSync,
  setLastUserSyncClickTimestamp,
  setOfflineRefreshAttempt,
} = portfolioRefreshSlice.actions;

export const selectIsRefreshing = (state: State) => state.portfolioRefresh.isRefreshing;

export const selectLastSyncTimestampSnapshot = (state: State) =>
  state.portfolioRefresh.lastSyncTimestampSnapshot;

export const selectHasCompletedInitialSync = (state: State) =>
  state.portfolioRefresh.hasCompletedInitialSync;

export const selectLastUserSyncClickTimestamp = (state: State) =>
  state.portfolioRefresh.lastUserSyncClickTimestamp;

export const selectLastOfflineRefreshAttemptTimestamp = (state: State) =>
  state.portfolioRefresh.lastOfflineRefreshAttemptTimestamp;

export const selectLastSyncTimestamp = createSelector(
  (state: State) => state.accounts.active,
  (accounts): number | null => {
    if (accounts.length === 0) return null;
    const max = Math.max(...accounts.map(a => a.lastSyncDate.getTime()));
    return max > 0 ? max : null;
  },
);

export default portfolioRefreshSlice.reducer;
