import { renderHook } from "tests/testSetup";
import { act } from "@testing-library/react";
import { useSearch } from "../useSearch";
import { track } from "~/renderer/analytics/segment";
import { jest } from "@jest/globals";

describe("useSearch", () => {
  const mockSetSearchedValue = jest.fn();
  const defaultProps = {
    setSearchedValue: mockSetSearchedValue,
    source: "test",
    flow: "testing",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should initialize with default value if provided", () => {
    const { result } = renderHook(() => useSearch({ ...defaultProps, searchedValue: "BTC" }));

    expect(result.current.displayedValue).toBe("BTC");
  });

  it("should initialize with undefined value when no searchedValue provided", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    expect(result.current.displayedValue).toBeUndefined();
  });

  it("should handle search input changes", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("Bitcoin");
    });

    expect(result.current.displayedValue).toBe("Bitcoin");
  });

  it("should handle search input changes with string", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("Ethereum");
    });

    expect(result.current.displayedValue).toBe("Ethereum");
  });

  it("should call setSearchedValue when handleDebouncedChange is called", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleDebouncedChange("Bitcoin", "");
    });

    expect(mockSetSearchedValue).toHaveBeenCalledWith("Bitcoin");
  });

  it("should track search query when manually calling handleDebouncedChange", () => {
    const { result } = renderHook(() => useSearch(defaultProps));
    const previousQuery = "";
    const currentQuery = "Bit";

    act(() => {
      result.current.handleDebouncedChange(currentQuery, previousQuery);
    });

    expect(track).toHaveBeenCalledWith("asset_searched", {
      searched_value: "Bit",
      source: "test",
      page: "Asset Selection",
      flow: "testing",
      asset_component_features: {
        apy: false,
        balance: false,
        filter: false,
        market_trend: false,
      },
    });
  });

  it("should not track search if current and previous queries are the same", () => {
    const { result } = renderHook(() => useSearch(defaultProps));
    const sameQuery = "Bit";

    act(() => {
      result.current.handleDebouncedChange(sameQuery, sameQuery);
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should handle the workflow of typing and tracking", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("ET");
    });

    expect(result.current.displayedValue).toBe("ET");

    act(() => {
      result.current.handleDebouncedChange("ET", "");
    });

    expect(mockSetSearchedValue).toHaveBeenCalledWith("ET");

    expect(track).toHaveBeenCalledWith("asset_searched", {
      page: "Asset Selection",
      searched_value: "ET",
      flow: "testing",
      source: "test",
      asset_component_features: {
        apy: false,
        balance: false,
        filter: false,
        market_trend: false,
      },
    });
  });
});
