import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { MAX_DISCOVERY_STOCKS } from "LLM/features/WalletAssets/constants";
import { useStocksDiscoverySectionViewModel } from "../useStocksDiscoverySectionViewModel";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockOpenFromMarket = jest.fn();
jest.mock("LLM/features/AssetDetail/hooks/useAssetDetailNavigation", () => ({
  useAssetDetailNavigation: () => ({ openFromMarket: mockOpenFromMarket }),
}));

const mockDefaultStocks = jest.fn();
jest.mock("LLM/hooks/useDefaultStocksAssets", () => ({
  useDefaultStocksAssets: (...args: unknown[]) => mockDefaultStocks(...args),
}));

const stock = (ticker: string): StockSuggestion => ({
  id: ticker,
  name: ticker,
  ticker,
  navigationId: `${ticker}-mkt`,
  ledgerId: `${ticker}-ledger`,
});

describe("useStocksDiscoverySectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDefaultStocks.mockReturnValue({
      stocks: [stock("AAPL")],
      isLoading: false,
      isError: false,
    });
  });

  it("exposes the top discovery stocks from the DADA hook", () => {
    const { result } = renderHook(() => useStocksDiscoverySectionViewModel());

    expect(result.current.stocks.map(s => s.ticker)).toEqual(["AAPL"]);
    expect(mockDefaultStocks).toHaveBeenCalledWith(true, MAX_DISCOVERY_STOCKS);
  });

  it("navigates to the Market list filtered to stocks on Explore All", () => {
    const { result } = renderHook(() => useStocksDiscoverySectionViewModel());

    act(() => result.current.onPressExploreAll());

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketList, { category: "stocks" });
  });

  it("opens the market detail for a tapped discovery stock", () => {
    const { result } = renderHook(() => useStocksDiscoverySectionViewModel());

    act(() => result.current.onItemPress(stock("TSLA")));

    expect(mockOpenFromMarket).toHaveBeenCalledWith({
      marketCurrencyId: "TSLA-mkt",
      ledgerCurrencyIds: ["TSLA-ledger"],
      source: "portfolio",
    });
  });
});
