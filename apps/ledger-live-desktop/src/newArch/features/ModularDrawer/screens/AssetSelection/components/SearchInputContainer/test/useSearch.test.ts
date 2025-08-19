import { renderHook, act } from "tests/testSetup";
import { useSearch } from "../useSearch";
import { track } from "~/renderer/analytics/segment";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { jest } from "@jest/globals";

describe("useSearch", () => {
  const mockCurrencies = [
    { name: "Bitcoin", ticker: "BTC", id: "bitcoin", type: "CryptoCurrency" },
    { name: "Ethereum", ticker: "ETH", id: "ethereum", type: "CryptoCurrency" },
    { name: "Solana", ticker: "SOL", id: "solana", type: "CryptoCurrency" },
    { name: "Tether", ticker: "USDT", id: "tether", type: "TokenCurrency" },
    { name: "Cosmos", ticker: "ATOM", id: "cosmos", type: "CryptoCurrency" },
    { name: "Binance-Peg Cosmos Token", ticker: "ATOM", id: "bsc/bep20/binance-peg_cosmos_token", type: "TokenCurrency" },
  ] as CryptoOrTokenCurrency[];

  const mockAssetsToDisplay = [
    { name: "Bitcoin", ticker: "BTC", id: "bitcoin", type: "CryptoCurrency" },
    { name: "Ethereum", ticker: "ETH", id: "ethereum", type: "CryptoCurrency" },
    { name: "Cosmos", ticker: "ATOM", id: "cosmos", type: "CryptoCurrency" },
    { name: "Binance-Peg Cosmos Token", ticker: "ATOM", id: "bsc/bep20/binance-peg_cosmos_token", type: "TokenCurrency" },
  ] as CryptoOrTokenCurrency[];

  const mockSetItemsToDisplay = jest.fn();
  const mockSetSearchedValue = jest.fn();
  const defaultProps = {
    setItemsToDisplay: mockSetItemsToDisplay,
    setSearchedValue: mockSetSearchedValue,
    assetsToDisplay: mockAssetsToDisplay,
    originalAssets: mockAssetsToDisplay,
    source: "test",
    flow: "testing",
    items: mockCurrencies,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should initialize with default value if provided", () => {
    const { result } = renderHook(() => useSearch({ ...defaultProps, defaultValue: "BTC" }));

    expect(result.current.displayedValue).toBe("BTC");
    expect(mockSetItemsToDisplay).not.toHaveBeenCalled();
  });

  it("should not filter list when search query is less than 2 characters", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("B");
    });

    expect(result.current.displayedValue).toBe("B");
    expect(mockSetItemsToDisplay).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
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
    expect(mockSetItemsToDisplay).toHaveBeenCalledWith([
      { name: "Bitcoin", ticker: "BTC", id: "bitcoin", type: "CryptoCurrency" },
    ]);
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
    expect(mockSetItemsToDisplay).toHaveBeenCalledWith(mockAssetsToDisplay);
  });

  it("should track search query when manually calling handleDebouncedChange", () => {
    const { result } = renderHook(() => useSearch(defaultProps));
    const previousQuery = "";
    const currentQuery = "Bit";

    act(() => {
      result.current.handleSearch(currentQuery);
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

  it("should handle the workflow of typing, filtering, and tracking", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("ET");
    });

    expect(result.current.displayedValue).toBe("ET");
    expect(mockSetItemsToDisplay).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDebouncedChange("ET", "");
    });

    expect(mockSetItemsToDisplay).toHaveBeenCalled();

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

  it("should match tokens with names containing the search term in the middle", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("Cosmos");
    });

    act(() => {
      result.current.handleDebouncedChange("Cosmos", "");
    });

    expect(result.current.displayedValue).toBe("Cosmos");
    // Verify that both "Cosmos" and "Binance-Peg Cosmos Token" are matched
    expect(mockSetItemsToDisplay).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "Cosmos", ticker: "ATOM" }),
        expect.objectContaining({ name: "Binance-Peg Cosmos Token", ticker: "ATOM" }),
      ])
    );
    expect(mockSetSearchedValue).toHaveBeenCalledWith("Cosmos");
  });
});
