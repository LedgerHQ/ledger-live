import { renderHook } from "tests/testSetup";
import { act } from "@testing-library/react";
import { useSearch } from "../useSearch";
import { track } from "~/renderer/analytics/segment";
import { jest } from "@jest/globals";

describe("useSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should initialize with store value", () => {
    const { result } = renderHook(() => useSearch(), {
      initialState: {
        modularDrawer: {
          searchedValue: "BTC",
        },
      },
    });

    expect(result.current.displayedValue).toBe("BTC");
  });

  it("should initialize with undefined value when no searchedValue provided", () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.displayedValue).toBeUndefined();
  });

  it("should handle search input changes", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearch("Bitcoin");
    });

    expect(result.current.displayedValue).toBe("Bitcoin");
  });

  it("should handle search input changes with string", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearch("Ethereum");
    });

    expect(result.current.displayedValue).toBe("Ethereum");
  });

  it("should set redux value when handleDebouncedChange is called", () => {
    const { result, store } = renderHook(() => useSearch());

    act(() => {
      result.current.handleDebouncedChange("Bitcoin", "");
    });

    expect(store.getState().modularDrawer.searchedValue).toBe("Bitcoin");
  });

  it("should track search query when manually calling handleDebouncedChange", () => {
    const { result } = renderHook(() => useSearch());
    const previousQuery = "";
    const currentQuery = "Bit";

    act(() => {
      result.current.handleDebouncedChange(currentQuery, previousQuery);
    });

    expect(track).toHaveBeenCalledWith("asset_searched", {
      searched_value: "Bit",
      source: "",
      page: "Asset Selection",
      flow: "",
      asset_component_features: {
        apy: false,
        balance: false,
        filter: false,
        market_trend: false,
      },
    });
  });

  it("should not track search if current and previous queries are the same", () => {
    const { result } = renderHook(() => useSearch());
    const sameQuery = "Bit";

    act(() => {
      result.current.handleDebouncedChange(sameQuery, sameQuery);
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should handle the workflow of typing and tracking", () => {
    const { result, store } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearch("ET");
    });

    expect(result.current.displayedValue).toBe("ET");

    act(() => {
      result.current.handleDebouncedChange("ET", "");
    });

    expect(store.getState().modularDrawer.searchedValue).toBe("ET");

    expect(track).toHaveBeenCalledWith("asset_searched", {
      page: "Asset Selection",
      searched_value: "ET",
      flow: "",
      source: "",
      asset_component_features: {
        apy: false,
        balance: false,
        filter: false,
        market_trend: false,
      },
    });
  });
});
