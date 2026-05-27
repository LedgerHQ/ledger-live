import { renderHook } from "@tests/test-renderer";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { State } from "~/reducers/types";

const mockUseCategorizedAssets = jest.fn();
const mockUseDistribution = jest.fn();
const mockUseStablecoinTickers = jest.fn();

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

const withBlacklistedTokens =
  (tokenIds: string[]) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, blacklistedTokenIds: tokenIds },
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
    mockUseCategorizedAssets.mockReturnValue({ cryptos: [], stablecoins: [] });
  });

  describe("blacklist filtering", () => {
    it("removes blacklisted CryptoCurrency parents from cryptos", () => {
      const btc = makeItem("Bitcoin", "bitcoin", "CryptoCurrency");
      const eth = makeItem("Ethereum", "ethereum", "CryptoCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [btc, eth], stablecoins: [] });

      const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
        overrideInitialState: withBlacklistedTokens(["ethereum"]),
      });

      expect(result.current.categorizedAssets.cryptos).toHaveLength(1);
      expect(result.current.categorizedAssets.cryptos[0].currency.id).toBe("bitcoin");
    });

    it("removes blacklisted TokenCurrency entries from stablecoins", () => {
      const usdc = makeItem("USDC", "usdc-token", "TokenCurrency");
      const usdt = makeItem("USDT", "usdt-token", "TokenCurrency");
      mockUseCategorizedAssets.mockReturnValue({ cryptos: [], stablecoins: [usdc, usdt] });

      const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
        overrideInitialState: withBlacklistedTokens(["usdc-token"]),
      });

      expect(result.current.categorizedAssets.stablecoins).toHaveLength(1);
      expect(result.current.categorizedAssets.stablecoins[0].currency.id).toBe("usdt-token");
    });

    it("returns the original list unchanged when no token is blacklisted", () => {
      const btc = makeItem("Bitcoin", "bitcoin", "CryptoCurrency");
      const usdc = makeItem("USDC", "usdc-token", "TokenCurrency");
      const source = { cryptos: [btc], stablecoins: [usdc] };
      mockUseCategorizedAssets.mockReturnValue(source);

      const { result } = renderHook(() => useCategorizedAssetsFromPortfolio());

      expect(result.current.categorizedAssets).toBe(source);
    });
  });

  describe("loading state", () => {
    it("reports loading when distribution is loading", () => {
      mockUseDistribution.mockReturnValue({ isAvailable: true, list: [], isLoading: true });

      const { result } = renderHook(() => useCategorizedAssetsFromPortfolio());

      expect(result.current.isLoadingStablecoinTickers).toBe(true);
    });

    it("reports loading when stablecoin tickers are loading", () => {
      mockUseStablecoinTickers.mockReturnValue({
        tickers: new Set<string>(),
        isLoading: true,
        isError: false,
      });

      const { result } = renderHook(() => useCategorizedAssetsFromPortfolio());

      expect(result.current.isLoadingStablecoinTickers).toBe(true);
    });
  });
});
