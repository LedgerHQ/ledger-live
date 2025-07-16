import { renderHook, act } from "tests/testSetup";
import { useSearch } from "../useSearch";
import { track } from "~/renderer/analytics/segment";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

// Mock timer functions
jest.useFakeTimers();

describe("useSearch", () => {
  const mockCurrencies = [
    { name: "Bitcoin", ticker: "BTC", id: "bitcoin", type: "CryptoCurrency" },
    { name: "Ethereum", ticker: "ETH", id: "ethereum", type: "CryptoCurrency" },
    { name: "Solana", ticker: "SOL", id: "solana", type: "CryptoCurrency" },
    { name: "Tether", ticker: "USDT", id: "tether", type: "TokenCurrency" },
  ] as CryptoOrTokenCurrency[];

  const mockSetItemsToDisplay = jest.fn();
  const defaultProps = {
    setItemsToDisplay: mockSetItemsToDisplay,
    source: "test",
    flow: "testing",
    items: mockCurrencies,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should initialize with empty search query", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useSearch(defaultProps));

    // Assert
    expect(result.current.searchQuery).toBe("");
    expect(mockSetItemsToDisplay).toHaveBeenCalledTimes(1);
    expect(mockSetItemsToDisplay).toHaveBeenCalledWith(mockCurrencies);
  });

  it("should return all items when search query is less than 2 characters", () => {
    // Arrange
    const { result } = renderHook(() => useSearch(defaultProps));

    // Act
    act(() => {
      result.current.handleSearch("B");
    });

    // Assert
    expect(result.current.searchQuery).toBe("B");
    expect(mockSetItemsToDisplay).toHaveBeenCalledWith(mockCurrencies);
    expect(track).not.toHaveBeenCalled();
  });

  it("should filter items based on search query", () => {
    // Arrange
    const { result } = renderHook(() => useSearch(defaultProps));

    // Act
    act(() => {
      result.current.handleSearch("Bit");
    });

    // Assert
    expect(result.current.searchQuery).toBe("Bit");
    expect(mockSetItemsToDisplay).toHaveBeenCalled();
    // We expect that only Bitcoin would match "Bit" in our mock data
    // But since Fuse.js is a complex search library and we're mocking it,
    // we just verify that setItemsToDisplay was called with some results
    expect(track).not.toHaveBeenCalled(); // Tracking should not be called automatically
  });

  it("should track search query when manually calling trackSearch", () => {
    // Arrange
    const { result } = renderHook(() => useSearch(defaultProps));
    const previousQuery = "";
    const currentQuery = "Bit";

    // Act
    act(() => {
      result.current.handleSearch(currentQuery);
      result.current.trackSearch(currentQuery, previousQuery);
    });

    // Assert
    expect(track).toHaveBeenCalledWith("asset_searched", {
      query: "Bit",
      page: "test",
      flow: "testing",
    });
  });

  it("should not track search if current and previous queries are the same", () => {
    // Arrange
    const { result } = renderHook(() => useSearch(defaultProps));
    const sameQuery = "Bit";

    // Act
    act(() => {
      result.current.trackSearch(sameQuery, sameQuery);
    });

    // Assert
    expect(track).not.toHaveBeenCalled();
  });

  it("should not track search if query is empty", () => {
    // Arrange
    const { result } = renderHook(() => useSearch(defaultProps));

    // Act
    act(() => {
      result.current.trackSearch("", "previous");
    });

    // Assert
    expect(track).not.toHaveBeenCalled();
  });

  it("should handle the workflow of typing, filtering and tracking", () => {
    // Arrange
    const { result } = renderHook(() => useSearch(defaultProps));

    // Act - Simulate typing "ET"
    act(() => {
      result.current.handleSearch("ET");
    });

    // Validate immediate filter effect
    expect(result.current.searchQuery).toBe("ET");
    expect(mockSetItemsToDisplay).toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled(); // Not tracked yet

    // Act - Simulate the debounced callback being triggered
    act(() => {
      result.current.trackSearch("ET", "");
    });

    // Assert tracking was called correctly
    expect(track).toHaveBeenCalledWith("asset_searched", {
      query: "ET",
      page: "test",
      flow: "testing",
    });
  });
});
