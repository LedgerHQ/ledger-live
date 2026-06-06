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
      sorting: "gainers",
      timeframe: "1D",
      network: "all",
    });
  });

  it("blocks volume sorting while the API does not support it", () => {
    const { result, store } = renderHook(() => useMarketFilters());

    act(() => result.current.onSelectSorting("volume"));

    expect(store.getState().marketListConfig.sorting).toBe("marketCap");
    expect(track).not.toHaveBeenCalled();
  });

  it("persists timeframe values and tracks them with the current sorting", () => {
    const { result, store } = renderHook(() => useMarketFilters());

    act(() => result.current.onSelectTimeframe("30D"));

    expect(store.getState().marketListConfig.timeframe).toBe("30D");
    expect(track).toHaveBeenCalledWith("sort_market_list", {
      sorting: "marketCap",
      timeframe: "30D",
      network: "all",
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
