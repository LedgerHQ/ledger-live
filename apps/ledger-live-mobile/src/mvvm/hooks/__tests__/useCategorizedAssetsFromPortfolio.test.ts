import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { State } from "~/reducers/types";

const mockUseCategorizedAssets = jest.fn();
const mockUseDistribution = jest.fn();
const mockUseStablecoinTickers = jest.fn();
const mockUseStockAssetIds = jest.fn();

jest.mock("@ledgerhq/asset-aggregation/assetCategorization/index", () => ({
  useCategorizedAssets: (...args: unknown[]) => mockUseCategorizedAssets(...args),
}));

jest.mock("~/actions/general", () => ({
  ...jest.requireActual("~/actions/general"),
  useDistribution: (...args: unknown[]) => mockUseDistribution(...args),
}));

jest.mock("@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers", () => ({
  useStablecoinTickers: (...args: unknown[]) => mockUseStablecoinTickers(...args),
}));

jest.mock("@ledgerhq/live-common/dada-client/hooks/useStockAssetIds", () => ({
  useStockAssetIds: (...args: unknown[]) => mockUseStockAssetIds(...args),
}));

const withBlacklistedTokens =
  (tokenIds: string[]) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, blacklistedTokenIds: tokenIds },
  });

const renderCategorized = (options?: {
  discoverability?: boolean;
  blacklistedTokenIds?: string[];
}) =>
  renderHook(() => useCategorizedAssetsFromPortfolio(), {
    overrideInitialState: withFlagOverrides(
      {
        lwmWallet40: {
          enabled: true,
          params: { assetDiscoverability: options?.discoverability ?? true },
        },
      },
      options?.blacklistedTokenIds ? withBlacklistedTokens(options.blacklistedTokenIds) : undefined,
    ),
  });

const makeItem = (name: string, id: string, type: "CryptoCurrency" | "TokenCurrency") => ({
  currency: { id, name, type, ticker: id.toUpperCase() },
  balance: 100,
  value: 100,
  distribution: 0.5,
  accounts: [],
});

describe("useCategorizedAssetsFromPortfolio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDistribution.mockReturnValue({ isAvailable: true, list: [], isLoading: false });
    mockUseStablecoinTickers.mockReturnValue({
      tickers: new Set<string>(),
      isLoading: false,
      isError: false,
    });
    mockUseStockAssetIds.mockReturnValue({
      ids: new Set<string>(),
      isLoading: false,
      isError: false,
    });
    mockUseCategorizedAssets.mockReturnValue({ cryptos: [], stablecoins: [] });
  });

  describe("blacklist filtering", () => {
    it("removes blacklisted CryptoCurrency parents from cryptos", () => {
      const btc = makeItem("Bitcoin", "bitcoin", "CryptoCurrency");
      const eth = makeItem("Ethereum", "ethereum", "CryptoCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [btc, eth], stablecoins: [] });

      const { result } = renderCategorized({ blacklistedTokenIds: ["ethereum"] });

      expect(result.current.categorizedAssets.cryptos).toHaveLength(1);
      expect(result.current.categorizedAssets.cryptos[0].currency.id).toBe("bitcoin");
    });

    it("removes blacklisted TokenCurrency entries from stablecoins", () => {
      const usdc = makeItem("USDC", "usdc-token", "TokenCurrency");
      const usdt = makeItem("USDT", "usdt-token", "TokenCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [], stablecoins: [usdc, usdt] });

      const { result } = renderCategorized({ blacklistedTokenIds: ["usdc-token"] });

      expect(result.current.categorizedAssets.stablecoins).toHaveLength(1);
      expect(result.current.categorizedAssets.stablecoins[0].currency.id).toBe("usdt-token");
    });

    it("keeps cryptos and stablecoins when no token is blacklisted", () => {
      const btc = makeItem("Bitcoin", "bitcoin", "CryptoCurrency");
      const usdc = makeItem("USDC", "usdc-token", "TokenCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [btc], stablecoins: [usdc] });

      const { result } = renderCategorized();

      expect(result.current.categorizedAssets.cryptos.map(a => a.currency.id)).toEqual(["bitcoin"]);
      expect(result.current.categorizedAssets.stablecoins.map(a => a.currency.id)).toEqual([
        "usdc-token",
      ]);
      expect(result.current.categorizedAssets.stocks).toEqual([]);
    });
  });

  describe("stocks bucketing", () => {
    it("moves held stocks out of cryptos by DADA currency id", () => {
      const btc = makeItem("Bitcoin", "bitcoin", "CryptoCurrency");
      const aapl = makeItem("Apple xStock", "aapl-x", "TokenCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [btc, aapl], stablecoins: [] });
      mockUseStockAssetIds.mockReturnValue({
        ids: new Set(["aapl-x"]),
        isLoading: false,
        isError: false,
      });

      const { result } = renderCategorized();

      expect(result.current.categorizedAssets.cryptos.map(a => a.currency.id)).toEqual(["bitcoin"]);
      expect(result.current.categorizedAssets.stocks.map(a => a.currency.id)).toEqual(["aapl-x"]);
    });

    it("does not miscategorize a crypto whose ticker collides with a stock symbol", () => {
      const ton = makeItem("Toncoin", "ton", "CryptoCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [ton], stablecoins: [] });
      mockUseStockAssetIds.mockReturnValue({
        ids: new Set(["some-tokenized-stock"]),
        isLoading: false,
        isError: false,
      });

      const { result } = renderCategorized();

      expect(result.current.categorizedAssets.cryptos.map(a => a.currency.id)).toEqual(["ton"]);
      expect(result.current.categorizedAssets.stocks).toEqual([]);
    });

    it("leaves cryptos untouched and stocks empty when no id matches", () => {
      const btc = makeItem("Bitcoin", "bitcoin", "CryptoCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [btc], stablecoins: [] });

      const { result } = renderCategorized();

      expect(result.current.categorizedAssets.cryptos).toHaveLength(1);
      expect(result.current.categorizedAssets.stocks).toEqual([]);
    });

    it("keeps stocks under cryptos when assetDiscoverability is off", () => {
      const btc = makeItem("Bitcoin", "bitcoin", "CryptoCurrency");
      const aapl = makeItem("Apple xStock", "aapl-x", "TokenCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [btc, aapl], stablecoins: [] });
      mockUseStockAssetIds.mockReturnValue({
        ids: new Set(["aapl-x"]),
        isLoading: false,
        isError: false,
      });

      const { result } = renderCategorized({ discoverability: false });

      expect(result.current.categorizedAssets.stocks).toEqual([]);
      expect(result.current.categorizedAssets.cryptos.map(a => a.currency.id)).toEqual([
        "bitcoin",
        "aapl-x",
      ]);
    });
  });

  describe("loading state", () => {
    it("reports loading when distribution is loading", () => {
      mockUseDistribution.mockReturnValue({ isAvailable: true, list: [], isLoading: true });

      const { result } = renderCategorized();

      expect(result.current.isLoadingStablecoinTickers).toBe(true);
    });

    it("reports loading when stablecoin tickers are loading", () => {
      mockUseStablecoinTickers.mockReturnValue({
        tickers: new Set<string>(),
        isLoading: true,
        isError: false,
      });

      const { result } = renderCategorized();

      expect(result.current.isLoadingStablecoinTickers).toBe(true);
    });
  });
});
