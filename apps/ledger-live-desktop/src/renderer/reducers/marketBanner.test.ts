import reducer, {
  marketBannerInitialState,
  setMarketBannerRanking,
  importMarketBannerState,
  selectMarketBannerRanking,
} from "./marketBanner";
import type { State } from "./index";

describe("marketBanner slice", () => {
  it("defaults to the trending ranking", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({ ranking: "trending" });
  });

  it("sets the ranking", () => {
    const state = reducer(marketBannerInitialState, setMarketBannerRanking("gainers"));
    expect(state.ranking).toBe("gainers");
  });

  it("hydrates the ranking from persisted state", () => {
    const state = reducer(marketBannerInitialState, importMarketBannerState({ ranking: "losers" }));
    expect(state.ranking).toBe("losers");
  });

  it("keeps the current ranking when hydrating with an empty payload", () => {
    const seeded = reducer(marketBannerInitialState, setMarketBannerRanking("favorites"));
    const state = reducer(seeded, importMarketBannerState({}));
    expect(state.ranking).toBe("favorites");
  });

  it("selects the ranking from the root state", () => {
    expect(selectMarketBannerRanking({ marketBanner: { ranking: "gainers" } } as State)).toBe(
      "gainers",
    );
  });
});
