import {
  MARKET_LIST_CONFIG_INITIAL_STATE,
  marketListConfigReducer,
  importMarketListConfig,
  selectMarketListCategory,
  selectMarketListNetwork,
  selectMarketListSorting,
  selectMarketListTimeframe,
  setMarketListCategory,
  setMarketListNetwork,
  setMarketListSorting,
  setMarketListTimeframe,
} from "../market";
import type { MarketListConfigState, State } from "../types";

const asState = (marketListConfig: MarketListConfigState = MARKET_LIST_CONFIG_INITIAL_STATE) =>
  ({ marketListConfig }) as State;

describe("marketListConfig slice", () => {
  it("exposes the documented defaults through its selectors", () => {
    expect(selectMarketListSorting(asState())).toBe("marketCap");
    expect(selectMarketListTimeframe(asState())).toBe("1D");
    expect(selectMarketListNetwork(asState())).toBeUndefined();
    expect(selectMarketListCategory(asState())).toBe("all");
  });

  it("updates each preference through its action", () => {
    let state = marketListConfigReducer(undefined, setMarketListSorting("volume"));
    expect(state.sorting).toBe("volume");

    state = marketListConfigReducer(state, setMarketListTimeframe("7D"));
    expect(state.timeframe).toBe("7D");

    state = marketListConfigReducer(state, setMarketListNetwork("ethereum"));
    expect(state.network).toBe("ethereum");

    state = marketListConfigReducer(state, setMarketListCategory("starred"));
    expect(state.category).toBe("starred");
  });

  it("resets the network back to all networks", () => {
    const withNetwork = marketListConfigReducer(undefined, setMarketListNetwork("ethereum"));
    const reset = marketListConfigReducer(withNetwork, setMarketListNetwork(undefined));
    expect(reset.network).toBeUndefined();
  });

  it("rehydrates a persisted payload on top of the defaults", () => {
    const state = marketListConfigReducer(
      undefined,
      importMarketListConfig({
        sorting: "gainers",
        timeframe: "1Y",
        network: "bitcoin",
        category: "stocks",
      }),
    );
    expect(state).toEqual({
      sorting: "gainers",
      timeframe: "1Y",
      network: "bitcoin",
      category: "stocks",
    });
  });
});
