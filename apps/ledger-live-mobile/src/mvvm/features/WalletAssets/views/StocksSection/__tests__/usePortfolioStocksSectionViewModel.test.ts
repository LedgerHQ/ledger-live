import { act } from "@testing-library/react-native";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { MAX_STOCKS_TO_DISPLAY } from "LLM/features/WalletAssets/constants";
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
    isLoadingStocks: false,
    isStocksError: false,
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

  it("caps the display at MAX_STOCKS_TO_DISPLAY while reporting the full count", () => {
    const heldCount = MAX_STOCKS_TO_DISPLAY + 2;
    mockPortfolioWithStocks(
      Array.from({ length: heldCount }, () => createCryptoAsset(bitcoin, 1000)),
    );

    const { result } = renderHook(() => usePortfolioStocksSectionViewModel());

    expect(result.current.stocksCount).toBe(heldCount);
    expect(result.current.stocksToDisplay).toHaveLength(MAX_STOCKS_TO_DISPLAY);
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
