import { act } from "@testing-library/react-native";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import usePortfolioStocksSectionViewModel from "../usePortfolioStocksSectionViewModel";
import { bitcoin, ethereum, createCryptoAsset } from "../../CryptosSection/__tests__/shared";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ name: "Portfolio" }),
}));

const mockCategorizedAssets = jest.fn();

jest.mock("LLM/hooks/useCategorizedAssetsFromPortfolio", () => ({
  useCategorizedAssetsFromPortfolio: () => mockCategorizedAssets(),
}));

const toCategorizedItem = (asset: Asset) => ({
  currency: asset.currency,
  balance: asset.amount,
  value: 0,
  distribution: 0,
  accounts: asset.accounts,
});

const mockPortfolioWithStocks = (stockAssets: Asset[] = []): void => {
  mockCategorizedAssets.mockReturnValue({
    categorizedAssets: {
      cryptos: [],
      stablecoins: [],
      stocks: stockAssets.map(toCategorizedItem),
    },
    stablecoinTickers: new Set<string>(),
    isLoadingStablecoinTickers: false,
    isStablecoinTickersError: false,
    isLoadingStockTickers: false,
    isStockTickersError: false,
  });
};

describe("usePortfolioStocksSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolioWithStocks();
  });

  it("returns no stocks when none are held", () => {
    const { result } = renderHook(() => usePortfolioStocksSectionViewModel());

    expect(result.current.stocksCount).toBe(0);
    expect(result.current.stocksToDisplay).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });

  it("caps the display at 5 while reporting the full count", () => {
    mockPortfolioWithStocks(Array.from({ length: 7 }, () => createCryptoAsset(bitcoin, 1000)));

    const { result } = renderHook(() => usePortfolioStocksSectionViewModel());

    expect(result.current.stocksCount).toBe(7);
    expect(result.current.stocksToDisplay).toHaveLength(5);
    expect(result.current.hasMore).toBe(true);
  });

  it("navigates to the Crypto screen filtered to stocks on show all", () => {
    const { result } = renderHook(() => usePortfolioStocksSectionViewModel(), {
      overrideInitialState: withFlagOverrides({
        lwmWallet40: { enabled: true, params: { assetSection: true } },
      }),
    });

    act(() => {
      result.current.onPressShowAll();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
      screen: ScreenName.Crypto,
      params: { sourceScreenName: ScreenName.Portfolio, variant: "stocks" },
    });
  });

  it("navigates to asset detail on item press", () => {
    mockPortfolioWithStocks([createCryptoAsset(ethereum, 5000)]);

    const { result } = renderHook(() => usePortfolioStocksSectionViewModel());

    act(() => {
      result.current.onItemPress(result.current.stocksToDisplay[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
      screen: ScreenName.Asset,
      params: { currency: ethereum },
    });
  });
});
