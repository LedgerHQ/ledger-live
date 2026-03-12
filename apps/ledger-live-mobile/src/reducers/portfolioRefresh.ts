import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createSelector } from "~/context/selectors";
import { State } from "~/reducers/types";

export interface PortfolioRefreshState {
  isRefreshing: boolean;
  lastSyncTimestampSnapshot: number | null;
}

export const INITIAL_STATE: PortfolioRefreshState = {
  isRefreshing: false,
  lastSyncTimestampSnapshot: null,
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
  },
});

export const { setRefreshStarted, setRefreshCompleted } = portfolioRefreshSlice.actions;

export const selectIsRefreshing = (state: State) => state.portfolioRefresh.isRefreshing;

export const selectLastSyncTimestampSnapshot = (state: State) =>
  state.portfolioRefresh.lastSyncTimestampSnapshot;

export const selectLastSyncTimestamp = createSelector(
  (state: State) => state.accounts.active,
  (accounts): number | null => {
    if (accounts.length === 0) return null;
    const max = Math.max(...accounts.map(a => a.lastSyncDate.getTime()));
    return max > 0 ? max : null;
  },
);

export default portfolioRefreshSlice.reducer;
