import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "./index";

export type MarketBannerRanking = "trending" | "gainers" | "losers" | "favorites";

export type MarketBannerState = {
  ranking: MarketBannerRanking;
};

export const marketBannerInitialState: MarketBannerState = {
  ranking: "trending",
};

const marketBannerSlice = createSlice({
  name: "marketBanner",
  initialState: marketBannerInitialState,
  reducers: {
    setMarketBannerRanking: (state, action: PayloadAction<MarketBannerRanking>) => {
      state.ranking = action.payload;
    },
    importMarketBannerState: (state, action: PayloadAction<Partial<MarketBannerState>>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const { setMarketBannerRanking, importMarketBannerState } = marketBannerSlice.actions;

const selectMarketBannerState = (state: State): MarketBannerState =>
  state.marketBanner ?? marketBannerInitialState;

export const selectMarketBannerRanking = (state: State): MarketBannerRanking =>
  selectMarketBannerState(state).ranking;

export const marketBannerStoreSelector = selectMarketBannerState;

export default marketBannerSlice.reducer;
