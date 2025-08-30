import { renderHook, act } from "@tests/test-renderer";
import { useSearch } from "../useSearch";

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
    const { result } = renderHook(() => useSearch({ ...defaultProps, defaultValue: "BTC" }));

    expect(result.current.displayedValue).toBe("BTC");
    expect(mockSetSearchedValue).not.toHaveBeenCalled();
  });

  it("should not filter list when search query is less than 2 characters", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("B");
    });

    expect(result.current.displayedValue).toBe("B");
    expect(mockSetSearchedValue).not.toHaveBeenCalled();
  });

  it("should filter items based on search query from originalAssets", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("Bit");
    });

    act(() => {
      result.current.handleDebouncedChange("Bit", "");
    });

    expect(result.current.displayedValue).toBe("Bit");
    expect(mockSetSearchedValue).toHaveBeenCalledWith("Bit");
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
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("ET");
    });

    expect(result.current.displayedValue).toBe("ET");
    expect(mockSetSearchedValue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDebouncedChange("ET", "");
    });
  });
});
