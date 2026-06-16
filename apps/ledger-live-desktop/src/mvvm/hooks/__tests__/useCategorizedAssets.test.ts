import { renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import { useStockAssetIds } from "@ledgerhq/live-common/dada-client/hooks/useStockAssetIds";
import { useCategorizedAssetsFromPortfolio } from "../useCategorizedAssets";
import { BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useStockAssetIds");

const mockedUseStockAssetIds = jest.mocked(useStockAssetIds);

const mockStockAssetIds = ({ ids = [] as string[], isLoading = false, isError = false } = {}) =>
  mockedUseStockAssetIds.mockReturnValue({ ids: new Set(ids), isLoading, isError });

const initialState = {
  settings: { counterValue: "USD" },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStockAssetIds();
});

describe("useCategorizedAssetsFromPortfolio", () => {
  it("should categorize store accounts into cryptos and stablecoins", async () => {
    const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
      initialState: { ...initialState, accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC] },
    });

    await waitFor(() => {
      expect(result.current.categorizedAssets.stablecoins).toHaveLength(1);
    });

    expect(result.current.categorizedAssets.cryptos).toHaveLength(2);
    expect(result.current.categorizedAssets.stablecoins[0].currency.ticker).toBe("USDC");
  });

  it("should return empty categories when store has no accounts", () => {
    const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
      initialState: { ...initialState, accounts: [] },
    });

    expect(result.current.categorizedAssets.cryptos).toHaveLength(0);
    expect(result.current.categorizedAssets.stablecoins).toHaveLength(0);
  });

  it("should include currency info in categorized items", () => {
    const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
      initialState: { ...initialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.categorizedAssets.cryptos[0].currency.id).toBe("bitcoin");
  });

  it.each([
    {
      name: "filters out coins when a coin currency.id is included in blacklistedTokenIds",
      blacklistedTokenIds: ["bitcoin"],
      expectedCryptoIds: ["ethereum"],
      expectedStablecoinTickers: ["USDC"],
    },
    {
      name: "filters out stablecoins when their currency.id is blacklisted",
      blacklistedTokenIds: ["ethereum/erc20/usd__coin"],
      expectedCryptoIds: ["bitcoin", "ethereum"],
      expectedStablecoinTickers: [],
    },
    {
      name: "filters out both coins and stablecoins when their ids are blacklisted",
      blacklistedTokenIds: ["bitcoin", "ethereum/erc20/usd__coin"],
      expectedCryptoIds: ["ethereum"],
      expectedStablecoinTickers: [],
    },
    {
      name: "preserves the underlying categorized result when blacklistedTokenIds is empty",
      blacklistedTokenIds: [],
      expectedCryptoIds: ["bitcoin", "ethereum"],
      expectedStablecoinTickers: ["USDC"],
    },
  ])("$name", async ({ blacklistedTokenIds, expectedCryptoIds, expectedStablecoinTickers }) => {
    const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
      initialState: {
        settings: { counterValue: "USD", blacklistedTokenIds },
        accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC],
      },
    });

    await waitFor(() => {
      expect(result.current.categorizedAssets.cryptos).toHaveLength(expectedCryptoIds.length);
    });

    expect(result.current.categorizedAssets.cryptos.map(c => c.currency.id)).toEqual(
      expectedCryptoIds,
    );
    expect(result.current.categorizedAssets.stablecoins.map(s => s.currency.ticker)).toEqual(
      expectedStablecoinTickers,
    );
  });

  describe("stocks bucketing (assetDiscoverability on)", () => {
    const renderWithStocks = ({
      blacklistedTokenIds,
      discoverability = true,
    }: { blacklistedTokenIds?: string[]; discoverability?: boolean } = {}) =>
      renderHook(() => useCategorizedAssetsFromPortfolio(), {
        initialState: {
          ...withFlagOverrides({
            lwdWallet40: { enabled: true, params: { assetDiscoverability: discoverability } },
          }),
          settings: {
            counterValue: "USD",
            ...(blacklistedTokenIds ? { blacklistedTokenIds } : {}),
          },
          accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC],
        },
      });

    it("moves held stocks out of cryptos by DADA currency id", async () => {
      mockStockAssetIds({ ids: ["ethereum"] });

      const { result } = renderWithStocks();

      await waitFor(() => {
        expect(result.current.categorizedAssets.stablecoins).toHaveLength(1);
      });
      expect(result.current.categorizedAssets.cryptos.map(c => c.currency.id)).toEqual(["bitcoin"]);
      expect(result.current.categorizedAssets.stocks.map(s => s.currency.id)).toEqual(["ethereum"]);
    });

    it("matches by currency id, not ticker, so a ticker collision is not miscategorized", async () => {
      mockStockAssetIds({ ids: ["ETH"] });

      const { result } = renderWithStocks();

      await waitFor(() => {
        expect(result.current.categorizedAssets.cryptos).toHaveLength(2);
      });
      expect(result.current.categorizedAssets.stocks).toEqual([]);
    });

    it("keeps stocks under cryptos when assetDiscoverability is off", async () => {
      mockStockAssetIds({ ids: ["ethereum"] });

      const { result } = renderWithStocks({ discoverability: false });

      await waitFor(() => {
        expect(result.current.categorizedAssets.cryptos).toHaveLength(2);
      });
      expect(result.current.categorizedAssets.stocks).toEqual([]);
    });

    it("drops a blacklisted stock instead of bucketing it", async () => {
      mockStockAssetIds({ ids: ["ethereum"] });

      const { result } = renderWithStocks({ blacklistedTokenIds: ["ethereum"] });

      await waitFor(() => {
        expect(result.current.categorizedAssets.cryptos).toHaveLength(1);
      });
      expect(result.current.categorizedAssets.cryptos.map(c => c.currency.id)).toEqual(["bitcoin"]);
      expect(result.current.categorizedAssets.stocks).toEqual([]);
    });
  });

  describe("stocks loading and error", () => {
    it("reports stocks as loading while the stock ids are loading", () => {
      mockStockAssetIds({ isLoading: true });

      const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
        initialState: { ...initialState, accounts: [BTC_ACCOUNT] },
      });

      expect(result.current.isLoadingStocks).toBe(true);
    });

    it("surfaces the stock ids error", () => {
      mockStockAssetIds({ isError: true });

      const { result } = renderHook(() => useCategorizedAssetsFromPortfolio(), {
        initialState: { ...initialState, accounts: [BTC_ACCOUNT] },
      });

      expect(result.current.isStocksError).toBe(true);
    });
  });
});
