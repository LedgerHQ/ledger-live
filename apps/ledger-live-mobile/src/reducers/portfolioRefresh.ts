import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "~/context/selectors";
import { State } from "~/reducers/types";

export interface PortfolioRefreshState {
  isRefreshing: boolean;
}

export const INITIAL_STATE: PortfolioRefreshState = {
  isRefreshing: false,
};

const portfolioRefreshSlice = createSlice({
  name: "portfolioRefresh",
  initialState: INITIAL_STATE,
  reducers: {
    setRefreshStarted: state => {
      state.isRefreshing = true;
    },
    setRefreshCompleted: state => {
      state.isRefreshing = false;
    },
  },
});

export const { setRefreshStarted, setRefreshCompleted } = portfolioRefreshSlice.actions;

export const selectIsRefreshing = (state: State) => state.portfolioRefresh.isRefreshing;

export const selectLastSyncTimestamp = createSelector(
  (state: State) => state.accounts.active,
  (accounts): number | null => {
    if (accounts.length === 0) return null;
    const max = Math.max(...accounts.map(a => a.lastSyncDate.getTime()));
    return max > 0 ? max : null;
  },
);

export default portfolioRefreshSlice.reducer;
