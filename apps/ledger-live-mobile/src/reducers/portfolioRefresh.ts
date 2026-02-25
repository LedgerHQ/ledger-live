import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "~/reducers/types";

export interface PortfolioRefreshState {
  lastRefreshTimestamp: number | null;
  isRefreshing: boolean;
}

export const INITIAL_STATE: PortfolioRefreshState = {
  lastRefreshTimestamp: null,
  isRefreshing: false,
};

const portfolioRefreshSlice = createSlice({
  name: "portfolioRefresh",
  initialState: INITIAL_STATE,
  reducers: {
    setRefreshStarted: state => {
      state.isRefreshing = true;
    },
    setRefreshCompleted: (state, action: PayloadAction<number>) => {
      state.isRefreshing = false;
      state.lastRefreshTimestamp = action.payload;
    },
  },
});

export const { setRefreshStarted, setRefreshCompleted } = portfolioRefreshSlice.actions;

export const selectIsRefreshing = (state: State) => state.portfolioRefresh.isRefreshing;
export const selectLastRefreshTimestamp = (state: State) =>
  state.portfolioRefresh.lastRefreshTimestamp;

export default portfolioRefreshSlice.reducer;
