import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MarketBannerRanking, MarketBannerState, State } from "./types";

/**
 * V4 market banner config — the user's chosen ranking for the home market banner.
 * Persisted as a user preference (never reset).
 */
export const MARKET_BANNER_INITIAL_STATE: MarketBannerState = {
  ranking: "trending",
};

const marketBannerSlice = createSlice({
  name: "marketBanner",
  initialState: MARKET_BANNER_INITIAL_STATE,
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

export const selectMarketBannerRanking = (state: State): MarketBannerRanking =>
  state.marketBanner.ranking;

export const marketBannerStoreSelector = (state: State): MarketBannerState => state.marketBanner;

export const marketBannerReducer = marketBannerSlice.reducer;
