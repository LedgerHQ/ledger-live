import { renderHook, act } from "@tests/test-renderer";
import { useSearch } from "../useSearch";
import { State } from "~/reducers/types";

describe("useSearch", () => {
  const defaultProps = {
    source: "test",
    flow: "testing",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should initialize with default value if provided", () => {
    const { result } = renderHook(() => useSearch({ ...defaultProps }), {
      overrideInitialState: (state: State) => ({
        ...state,
        modularDrawer: {
          ...state.modularDrawer,
          searchValue: "BTC",
        },
      }),
    });

    expect(result.current.displayedValue).toBe("BTC");
  });

  it("should not filter list when search query is less than 2 characters", () => {
    const { result, store } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("B");
    });

    expect(result.current.displayedValue).toBe("B");
    expect(store.getState().modularDrawer.searchValue).toBe("");
  });

  it("should filter items based on search query from originalAssets", () => {
    const { result, store } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("Bit");
    });

    act(() => {
      result.current.handleDebouncedChange("Bit", "");
    });

    expect(result.current.displayedValue).toBe("Bit");
    expect(store.getState().modularDrawer.searchValue).toBe("Bit");
  });

  it("should reset items to originalAssets when search query is cleared", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("Bit");
    });

    act(() => {
      result.current.handleDebouncedChange("", "Bit");
    });

    expect(result.current.displayedValue).toBe("Bit");
  });

  it("should track search query when manually calling handleDebouncedChange", () => {
    const { result } = renderHook(() => useSearch(defaultProps));
    const previousQuery = "";
    const currentQuery = "Bit";

    act(() => {
      result.current.handleSearch(currentQuery);
      result.current.handleDebouncedChange(currentQuery, previousQuery);
    });
  });

  it("should not track search if current and previous queries are the same", () => {
    const { result } = renderHook(() => useSearch(defaultProps));
    const sameQuery = "Bit";

    act(() => {
      result.current.handleDebouncedChange(sameQuery, sameQuery);
    });
  });

  it("should handle the workflow of typing, filtering, and tracking", () => {
    const { result, store } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("ET");
    });

    expect(result.current.displayedValue).toBe("ET");
    expect(store.getState().modularDrawer.searchValue).toBe("");

    act(() => {
      result.current.handleDebouncedChange("ET", "");
    });

    expect(store.getState().modularDrawer.searchValue).toBe("ET");
  });

  it("should ignore whitespace-only queries", () => {
    const { result, store } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("   ");
      result.current.handleDebouncedChange("   ", "");
    });

    expect(store.getState().modularDrawer.searchValue).toBe("");
  });
});
