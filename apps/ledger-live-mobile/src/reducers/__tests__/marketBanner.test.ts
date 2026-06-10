import {
  MARKET_BANNER_INITIAL_STATE,
  marketBannerReducer,
  importMarketBannerState,
  selectMarketBannerRanking,
  setMarketBannerRanking,
} from "../marketBanner";
import type { MarketBannerState, State } from "../types";

const asState = (marketBanner: MarketBannerState = MARKET_BANNER_INITIAL_STATE) =>
  ({ marketBanner }) as State;

describe("marketBanner slice", () => {
  it("exposes the documented defaults through its selectors", () => {
    expect(selectMarketBannerRanking(asState())).toBe("trending");
  });

  it("updates the market banner ranking through its action", () => {
    let state = marketBannerReducer(undefined, setMarketBannerRanking("gainers"));
    expect(state.ranking).toBe("gainers");

    state = marketBannerReducer(state, setMarketBannerRanking("losers"));
    expect(state.ranking).toBe("losers");

    state = marketBannerReducer(state, setMarketBannerRanking("favorites"));
    expect(state.ranking).toBe("favorites");
  });

  it("rehydrates a persisted payload on top of the current state", () => {
    const state = marketBannerReducer(undefined, importMarketBannerState({ ranking: "favorites" }));
    expect(state).toEqual({ ranking: "favorites" });
  });
});
