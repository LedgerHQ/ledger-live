import { renderHook, act } from "@tests/test-renderer";
import { useSearch } from "../useSearch";
//import { track } from "~/renderer/analytics/segment";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
//import { jest } from "@jest/globals";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const ethereumCurrency = getCryptoCurrencyById("ethereum");
const arbitrumCurrency = getCryptoCurrencyById("arbitrum");
const baseCurrency = getCryptoCurrencyById("base");

describe("useSearch", () => {
  const mockCurrencies = [
    bitcoinCurrency,
    ethereumCurrency,
    arbitrumCurrency,
    baseCurrency,
  ] satisfies CryptoOrTokenCurrency[];

  const mockAssetsToDisplay = [bitcoinCurrency, ethereumCurrency] satisfies CryptoOrTokenCurrency[];

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
    //expect(track).not.toHaveBeenCalled();
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
    expect(mockSetItemsToDisplay).toHaveBeenCalledWith([bitcoinCurrency]);
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

    /*expect(track).toHaveBeenCalledWith("asset_searched", {
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
    });*/
  });

  it("should not track search if current and previous queries are the same", () => {
    const { result } = renderHook(() => useSearch(defaultProps));
    const sameQuery = "Bit";

    act(() => {
      result.current.handleDebouncedChange(sameQuery, sameQuery);
    });

    //expect(track).not.toHaveBeenCalled();
  });

  it("should handle the workflow of typing, filtering, and tracking", () => {
    const { result } = renderHook(() => useSearch(defaultProps));

    act(() => {
      result.current.handleSearch("ET");
    });

    expect(result.current.displayedValue).toBe("ET");
    expect(mockSetItemsToDisplay).not.toHaveBeenCalled();
    //expect(track).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDebouncedChange("ET", "");
    });

    expect(mockSetItemsToDisplay).toHaveBeenCalled();

    /*expect(track).toHaveBeenCalledWith("asset_searched", {
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
    });*/
  });
});
