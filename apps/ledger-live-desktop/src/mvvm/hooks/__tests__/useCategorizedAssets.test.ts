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
});
