import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/reducers/types";

export interface PortfolioBalanceDisplayState {
  displayedBalance: number;
  isLoading: boolean;
  isBalanceAvailable: boolean;
}

export const INITIAL_STATE: PortfolioBalanceDisplayState = {
  displayedBalance: 0,
  isLoading: false,
  isBalanceAvailable: false,
};

const portfolioBalanceDisplaySlice = createSlice({
  name: "portfolioBalanceDisplay",
  initialState: INITIAL_STATE,
  reducers: {
    setPortfolioBalanceDisplay: (state, action: PayloadAction<PortfolioBalanceDisplayState>) => {
      state.displayedBalance = action.payload.displayedBalance;
      state.isLoading = action.payload.isLoading;
      state.isBalanceAvailable = action.payload.isBalanceAvailable;
    },
  },
});

export const { setPortfolioBalanceDisplay } = portfolioBalanceDisplaySlice.actions;

export const selectPortfolioBalanceDisplay = (state: State): PortfolioBalanceDisplayState =>
  state.portfolioBalanceDisplay;

export default portfolioBalanceDisplaySlice.reducer;
