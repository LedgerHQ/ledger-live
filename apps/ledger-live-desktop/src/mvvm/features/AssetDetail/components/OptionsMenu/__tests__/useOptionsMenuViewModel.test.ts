import { renderHook, act } from "tests/testSetup";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import { format } from "@ledgerhq/live-common/market/utils/currencyFormatter";
import type { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { DistributionItem } from "@ledgerhq/types-live";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { MarketMockedResponse } from "tests/handlers/fixtures/market";
import { useOptionsMenuViewModel } from "../useOptionsMenuViewModel";

const btc = getCryptoCurrencyById("bitcoin");
const [bitcoinMarketRaw] = MarketMockedResponse.bitcoinDetail as MarketItemResponse[];
const [usdcMarketRaw] = MarketMockedResponse.usdcDetail as MarketItemResponse[];

const bitcoinMarket: AssetMarketData = {
  marketCurrencyData: format(bitcoinMarketRaw),
  marketId: "bitcoin",
  isLoading: false,
};

const usdcMarket: AssetMarketData = {
  marketCurrencyData: format(usdcMarketRaw),
  marketId: "usd-coin",
  isLoading: false,
};

const emptyMarket: AssetMarketData = {
  marketCurrencyData: undefined,
  marketId: undefined,
  isLoading: false,
};

type Settings = {
  counterValue?: string;
  starredMarketCoins?: string[];
  blacklistedTokenIds?: string[];
};

function renderViewModel({
  distributionItem = buildDistributionItem({ currency: btc }),
  marketData = bitcoinMarket,
  settings = {},
}: {
  distributionItem?: DistributionItem;
  marketData?: AssetMarketData;
  settings?: Settings;
} = {}) {
  return renderHook(
    () => useOptionsMenuViewModel({ distributionItem, marketData, currency: btc }),
    {
      initialState: { settings: { counterValue: "USD", starredMarketCoins: [], ...settings } },
    },
  );
}

describe("useOptionsMenuViewModel", () => {
  describe("favourite star id resolution", () => {
    it("prefers marketData.marketId (Coingecko id) over distributionItem.marketId so favourites stay aligned with the Market list", () => {
      const { result, store } = renderViewModel({
        distributionItem: buildDistributionItem({
          currency: btc,
          marketId: "distribution-fallback-id",
        }),
      });

      expect(result.current.isStarEnabled).toBe(true);
      expect(result.current.isStarred).toBe(false);

      act(() => result.current.onToggleStar());

      const { starredMarketCoins } = store.getState().settings;
      expect(starredMarketCoins).toContain("bitcoin");
      expect(starredMarketCoins).not.toContain("distribution-fallback-id");
    });

    it("falls back to distributionItem.marketId when marketData.marketId is missing (DADA-only path)", () => {
      const { result, store } = renderViewModel({
        distributionItem: buildDistributionItem({ currency: btc, marketId: "coingecko-btc-id" }),
        marketData: {
          ...emptyMarket,
          marketCurrencyData: { id: "dada-internal-id" } as AssetMarketData["marketCurrencyData"],
        },
      });

      act(() => result.current.onToggleStar());

      const { starredMarketCoins } = store.getState().settings;
      expect(starredMarketCoins).toContain("coingecko-btc-id");
      expect(starredMarketCoins).not.toContain("dada-internal-id");
    });

    it("falls back to distributionItem.slug when neither marketId source is available (token case)", () => {
      const { result, store } = renderViewModel({
        distributionItem: buildDistributionItem({ currency: btc, slug: "usd-coin" }),
        marketData: emptyMarket,
      });

      expect(result.current.isStarEnabled).toBe(true);

      act(() => result.current.onToggleStar());

      expect(store.getState().settings.starredMarketCoins).toContain("usd-coin");
    });
  });

  it("reflects starred state from settings using market id", () => {
    const { result } = renderViewModel({
      distributionItem: buildDistributionItem({ currency: btc, marketId: "bitcoin" }),
      settings: { starredMarketCoins: ["bitcoin"] },
    });

    expect(result.current.isStarred).toBe(true);
  });

  it("disables hide-from-portfolio when the currency is a coin (CryptoCurrency)", () => {
    const item = buildDistributionItem({ currency: btc });

    const { result } = renderHook(
      () =>
        useOptionsMenuViewModel({
          distributionItem: item,
          marketData: bitcoinMarket,
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
          marketData: usdcMarket,
          currency: usdcToken,
        }),
      { initialState: { settings: { counterValue: "USD" } } },
    );

    expect(result.current.isHideFromPortfolioEnabled).toBe(true);
  });

  it("treats blacklisted currency as hidden from portfolio in the menu", () => {
    const { result } = renderViewModel({
      settings: { blacklistedTokenIds: ["bitcoin"] },
    });

    expect(result.current.isHiddenFromPortfolio).toBe(true);
  });
});
