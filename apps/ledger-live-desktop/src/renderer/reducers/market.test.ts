import { Order } from "@ledgerhq/live-common/market/utils/types";
import marketReducer, { type MarketState } from "./market";

const initialState: MarketState = {
  marketParams: {
    range: "24h",
    limit: 50,
    order: Order.MarketCapDesc,
    search: "",
  },
  currentPage: 1,
  hideTransactionsOnChart: false,
  category: "all",
};

describe("market reducer", () => {
  it("resets sort to default when switching category", () => {
    const withVolumeOnAll = marketReducer(initialState, {
      type: "MARKET_SET_VALUES",
      payload: { order: Order.VolumeDesc },
    });

    expect(withVolumeOnAll.marketParams.order).toBe(Order.VolumeDesc);

    const onStocks = marketReducer(withVolumeOnAll, {
      type: "MARKET_SET_CATEGORY",
      payload: "stocks",
    });

    expect(onStocks.category).toBe("stocks");
    expect(onStocks.marketParams.order).toBe(Order.MarketCapDesc);
    expect(onStocks.currentPage).toBe(1);

    const backToAll = marketReducer(onStocks, {
      type: "MARKET_SET_CATEGORY",
      payload: "all",
    });

    expect(backToAll.marketParams.order).toBe(Order.MarketCapDesc);
  });

  it("resets currentPage when the list identity changes", () => {
    const scrolledState: MarketState = { ...initialState, currentPage: 3 };

    const nextState = marketReducer(scrolledState, {
      type: "MARKET_SET_VALUES",
      payload: { order: Order.VolumeDesc },
    });

    expect(nextState.currentPage).toBe(1);
  });

  it("does not restore a persisted counter currency", () => {
    const nextState = marketReducer(initialState, {
      type: "MARKET_IMPORT_STATE",
      payload: {
        ...initialState,
        marketParams: { ...initialState.marketParams, counterCurrency: "EUR" },
      },
    });

    expect(nextState.marketParams.counterCurrency).toBeUndefined();
    expect(nextState.marketParams.range).toBe("24h");
    expect(nextState.marketParams.order).toBe(Order.MarketCapDesc);
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
      payload: { order: Order.VolumeDesc },
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
