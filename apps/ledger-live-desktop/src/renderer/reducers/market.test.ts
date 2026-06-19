import { Order } from "@ledgerhq/live-common/market/utils/types";
import marketReducer, { type MarketState } from "./market";

const initialState: MarketState = {
  marketParams: {
    range: "24h",
    limit: 50,
    starred: [],
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "USD",
  },
  currentPage: 1,
  hideTransactionsOnChart: false,
  category: "all",
};

describe("market reducer", () => {
  it("resets sort to default when switching category", () => {
    const withVolumeOnAll = marketReducer(initialState, {
      type: "MARKET_SET_VALUES",
      payload: { order: Order.VolumeDesc, page: 1 },
    });

    expect(withVolumeOnAll.marketParams.order).toBe(Order.VolumeDesc);

    const onStocks = marketReducer(withVolumeOnAll, {
      type: "MARKET_SET_CATEGORY",
      payload: "stocks",
    });

    expect(onStocks.category).toBe("stocks");
    expect(onStocks.marketParams.order).toBe(Order.MarketCapDesc);
    expect(onStocks.marketParams.page).toBe(1);
    expect(onStocks.currentPage).toBe(1);

    const backToAll = marketReducer(onStocks, {
      type: "MARKET_SET_CATEGORY",
      payload: "all",
    });

    expect(backToAll.marketParams.order).toBe(Order.MarketCapDesc);
  });

  it("resets currentPage when page is set back to 1", () => {
    const paginatedState: MarketState = {
      ...initialState,
      currentPage: 3,
      marketParams: { ...initialState.marketParams, page: 3 },
    };

    const nextState = marketReducer(paginatedState, {
      type: "MARKET_SET_VALUES",
      payload: { order: Order.VolumeDesc, page: 1 },
    });

    expect(nextState.currentPage).toBe(1);
    expect(nextState.marketParams.page).toBe(1);
  });

  it("does nothing when selecting the same category", () => {
    const nextState = marketReducer(initialState, {
      type: "MARKET_SET_CATEGORY",
      payload: "all",
    });

    expect(nextState).toBe(initialState);
  });

  it("heals missing category when selecting the default tab", () => {
    const partialState = {
      marketParams: initialState.marketParams,
      currentPage: 1,
      hideTransactionsOnChart: false,
    } as MarketState;

    const nextState = marketReducer(partialState, {
      type: "MARKET_SET_CATEGORY",
      payload: "all",
    });

    expect(nextState.category).toBe("all");
  });

  it("handles partial state without category", () => {
    const partialState = {
      marketParams: initialState.marketParams,
      currentPage: 1,
      hideTransactionsOnChart: false,
    } as MarketState;

    const withSort = marketReducer(partialState, {
      type: "MARKET_SET_VALUES",
      payload: { order: Order.VolumeDesc, page: 1 },
    });

    expect(withSort.marketParams.order).toBe(Order.VolumeDesc);

    const onStocks = marketReducer(withSort, {
      type: "MARKET_SET_CATEGORY",
      payload: "stocks",
    });

    expect(onStocks.category).toBe("stocks");
    expect(onStocks.marketParams.order).toBe(Order.MarketCapDesc);
  });
});
