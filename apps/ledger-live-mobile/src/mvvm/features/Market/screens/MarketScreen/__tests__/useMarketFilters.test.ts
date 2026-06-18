import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { useMarketFilters } from "../useMarketFilters";

jest.mock("~/analytics", () => ({ track: jest.fn() }));

describe("useMarketFilters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens and closes the filters drawer", () => {
    const { result } = renderHook(() => useMarketFilters());

    act(() => result.current.onOpen());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.onClose());
    expect(result.current.isOpen).toBe(false);
  });

  it("persists supported sorting values and tracks the selection", () => {
    const { result, store } = renderHook(() => useMarketFilters());

    act(() => result.current.onSelectSorting("gainers"));

    expect(store.getState().marketListConfig.sorting).toBe("gainers");
    expect(track).toHaveBeenCalledWith("sort_market_list", {
      sortVolume: "false",
      sortMarketCap: "false",
      sortChange: "true_desc",
      timeframe: "1D",
    });
  });

  it("persists volume sorting and tracks the selection", () => {
    const { result, store } = renderHook(() => useMarketFilters());

    act(() => result.current.onSelectSorting("volume"));

    expect(store.getState().marketListConfig.sorting).toBe("volume");
    expect(track).toHaveBeenCalledWith("sort_market_list", {
      sortVolume: "true_desc",
      sortMarketCap: "false",
      sortChange: "false",
      timeframe: "1D",
    });
  });

  it("persists timeframe values and tracks them with the current sorting", () => {
    const { result, store } = renderHook(() => useMarketFilters());

    act(() => result.current.onSelectTimeframe("30D"));

    expect(store.getState().marketListConfig.timeframe).toBe("30D");
    expect(track).toHaveBeenCalledWith("sort_market_list", {
      sortVolume: "false",
      sortMarketCap: "true_desc",
      sortChange: "false",
      timeframe: "30D",
    });
  });

  it("exposes the supported timeframe options without the all option", () => {
    const { result } = renderHook(() => useMarketFilters());

    expect(result.current.timeframeOptions.map(option => option.value)).toEqual([
      "1D",
      "7D",
      "30D",
      "6M",
      "1Y",
    ]);
  });
});
