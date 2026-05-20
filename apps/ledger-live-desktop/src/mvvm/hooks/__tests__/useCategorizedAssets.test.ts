import { renderHook, waitFor } from "tests/testSetup";
import { useCategorizedAssetsFromPortfolio } from "../useCategorizedAssets";
import { BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";

const initialState = {
  settings: { counterValue: "USD" },
};

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
      name: "does not filter out coins when a coin currency.id is included in blacklistedTokenIds",
      blacklistedTokenIds: ["bitcoin"],
      expectedCryptoIds: ["bitcoin", "ethereum"],
      expectedStablecoinTickers: ["USDC"],
    },
    {
      name: "filters out stablecoins when their currency.id is blacklisted",
      blacklistedTokenIds: ["ethereum/erc20/usd__coin"],
      expectedCryptoIds: ["bitcoin", "ethereum"],
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
});
