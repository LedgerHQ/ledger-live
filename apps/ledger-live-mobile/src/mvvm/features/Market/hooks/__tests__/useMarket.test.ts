import { renderHook, act } from "@tests/test-renderer";
import { useMarket } from "../useMarket";
import { State } from "~/reducers/types";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { withMarketState } from "../../__tests__/helpers";

describe("useMarket", () => {
  it("should return default market params from Redux state", () => {
    const { result } = renderHook(() => useMarket());

    expect(result.current.marketParams).toBeDefined();
    expect(result.current.marketParams.counterCurrency).toBeDefined();
    expect(result.current.marketCurrentPage).toBeDefined();
  });

  it("should return starredMarketCoins from settings", () => {
    const { result } = renderHook(() => useMarket(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          starredMarketCoins: ["bitcoin", "ethereum"],
        },
      }),
    });

    expect(result.current.starredMarketCoins).toEqual(["bitcoin", "ethereum"]);
  });

  it("should return filterByStarredCurrencies from market state", () => {
    const { result } = renderHook(
      () => useMarket(),
      withMarketState({ marketFilterByStarredCurrencies: true }),
    );

    expect(result.current.filterByStarredCurrencies).toBe(true);
  });

  it("should dispatch setMarketRequestParams when updateMarketParams is called", () => {
    const { result, store } = renderHook(() => useMarket());

    act(() => {
      result.current.updateMarketParams({ range: "7d", order: Order.MarketCapAsc });
    });

    expect(store.getState().market.marketParams.range).toBe("7d");
    expect(store.getState().market.marketParams.order).toBe(Order.MarketCapAsc);
  });

  it("should dispatch empty object when updateMarketParams is called without args", () => {
    const { result, store } = renderHook(() => useMarket());
    const prevParams = { ...store.getState().market.marketParams };

    act(() => {
      result.current.updateMarketParams();
    });

    expect(store.getState().market.marketParams.range).toBe(prevParams.range);
  });
});
