import { resolveMarketOrAssetDeeplinkIntent } from "../resolveMarketOrAssetDeeplinkIntent";

const base = {
  shouldDisplayAggregatedAssets: true,
  shouldDisplayAssetDiscoverability: true,
  categoryParam: null as string | null,
};

const tokenPath = "/ethereum/erc20/usd_tether__erc20_";
const tokenId = "ethereum/erc20/usd_tether__erc20_";

describe("resolveMarketOrAssetDeeplinkIntent", () => {
  describe("Wallet 4.0 on", () => {
    it("opens asset detail for a coin (market source)", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...base, hostname: "market", pathname: "/bitcoin" }),
      ).toEqual({
        type: "asset-detail",
        source: "deeplink_market",
        currencyId: "bitcoin",
        marketState: undefined,
      });
    });

    it("opens asset detail for a token with market state (asset source)", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...base, hostname: "asset", pathname: tokenPath }),
      ).toEqual({
        type: "asset-detail",
        source: "deeplink_asset",
        currencyId: tokenId,
        marketState: { id: tokenId, ledgerIds: [tokenId] },
      });
    });
  });

  describe("Wallet 4.0 off", () => {
    const off = { ...base, shouldDisplayAggregatedAssets: false };

    it("routes a coin to the legacy path", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...off, hostname: "market", pathname: "/bitcoin" }),
      ).toEqual({ type: "legacy-path", currencyId: "bitcoin" });
    });

    it("falls back to the market banner for a token on legacy market", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...off, hostname: "market", pathname: tokenPath }),
      ).toEqual({ type: "market-banner" });
    });

    it("falls back to portfolio for a token on legacy asset", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...off, hostname: "asset", pathname: tokenPath }),
      ).toEqual({ type: "portfolio" });
    });
  });

  describe("unresolved path", () => {
    it("routes a non-empty market path to the banner", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({
          ...base,
          hostname: "market",
          pathname: "/not-a-coin",
        }),
      ).toEqual({ type: "market-banner" });
    });

    it("pre-selects a category on the empty market path when discoverability is on", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({
          ...base,
          hostname: "market",
          pathname: "/",
          categoryParam: "stocks",
        }),
      ).toEqual({ type: "market-banner", category: "stocks" });
    });

    it("omits the category on the empty market path when discoverability is off", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({
          ...base,
          hostname: "market",
          pathname: "/",
          shouldDisplayAssetDiscoverability: false,
          categoryParam: "stocks",
        }),
      ).toEqual({ type: "market-banner", category: undefined });
    });

    it("routes a non-empty asset path to portfolio", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...base, hostname: "asset", pathname: "/not-a-coin" }),
      ).toEqual({ type: "portfolio" });
    });

    it("routes an empty asset path to portfolio when Wallet 4.0 is on", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...base, hostname: "asset", pathname: "/" }),
      ).toEqual({ type: "portfolio" });
    });

    it("continues for an empty asset path when Wallet 4.0 is off", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({
          ...base,
          hostname: "asset",
          pathname: "/",
          shouldDisplayAggregatedAssets: false,
        }),
      ).toEqual({ type: "continue" });
    });
  });
});
