import { renderHook, act } from "tests/testSetup";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import { format } from "@ledgerhq/live-common/market/utils/currencyFormatter";
import type { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { MarketMockedResponse } from "tests/handlers/fixtures/market";
import { useOptionsMenuViewModel } from "../useOptionsMenuViewModel";

const btc = getCryptoCurrencyById("bitcoin");

const [bitcoinMarketRaw] = MarketMockedResponse.bitcoinDetail as MarketItemResponse[];
const [usdcMarketRaw] = MarketMockedResponse.usdcDetail as MarketItemResponse[];

const bitcoinMarket: AssetMarketData = {
  marketCurrencyData: format(bitcoinMarketRaw),
  isLoading: false,
};

const usdcMarket: AssetMarketData = {
  marketCurrencyData: format(usdcMarketRaw),
  isLoading: false,
};

describe("useOptionsMenuViewModel", () => {
  it("prefers distributionItem.marketId for star key so market list stars stay in sync", () => {
    const item = buildDistributionItem({
      currency: btc,
      marketId: "coingecko-btc-id",
    });

    const { result, store } = renderHook(
      () =>
        useOptionsMenuViewModel({
          distributionItem: item,
          market: bitcoinMarket,
          marketInfo: undefined,
          currency: btc,
        }),
      { initialState: { settings: { counterValue: "USD", starredMarketCoins: [] } } },
    );

    expect(result.current.isStarEnabled).toBe(true);
    expect(result.current.isStarred).toBe(false);

    act(() => {
      result.current.onToggleStar();
    });

    expect(store.getState().settings.starredMarketCoins).toContain("coingecko-btc-id");
  });

  it("treats blacklisted currency as hidden from portfolio in the menu", () => {
    const item = buildDistributionItem({ currency: btc });

    const { result } = renderHook(
      () =>
        useOptionsMenuViewModel({
          distributionItem: item,
          market: bitcoinMarket,
          marketInfo: undefined,
          currency: btc,
        }),
      {
        initialState: {
          settings: {
            counterValue: "USD",
            starredMarketCoins: [],
            blacklistedTokenIds: ["bitcoin"],
          },
        },
      },
    );

    expect(result.current.isHiddenFromPortfolio).toBe(true);
  });

  it("reflects starred state from settings using market id", () => {
    const item = buildDistributionItem({
      currency: btc,
      marketId: "bitcoin",
    });

    const { result } = renderHook(
      () =>
        useOptionsMenuViewModel({
          distributionItem: item,
          market: bitcoinMarket,
          marketInfo: undefined,
          currency: btc,
        }),
      { initialState: { settings: { counterValue: "USD", starredMarketCoins: ["bitcoin"] } } },
    );

    expect(result.current.isStarred).toBe(true);
  });

  it("disables hide-from-portfolio when the currency is a coin (CryptoCurrency)", () => {
    const item = buildDistributionItem({ currency: btc });

    const { result } = renderHook(
      () =>
        useOptionsMenuViewModel({
          distributionItem: item,
          market: bitcoinMarket,
          marketInfo: undefined,
          currency: btc,
        }),
      { initialState: { settings: { counterValue: "USD" } } },
    );

    expect(result.current.isHideFromPortfolioEnabled).toBe(false);
  });

  it("enables hide-from-portfolio when the currency is a token (TokenCurrency)", () => {
    const item = buildDistributionItem({ currency: usdcToken });

    const { result } = renderHook(
      () =>
        useOptionsMenuViewModel({
          distributionItem: item,
          market: usdcMarket,
          marketInfo: undefined,
          currency: usdcToken,
        }),
      { initialState: { settings: { counterValue: "USD" } } },
    );

    expect(result.current.isHideFromPortfolioEnabled).toBe(true);
  });
});
