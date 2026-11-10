import { resolveMarketOrAssetDeeplinkIntent } from "../resolveMarketOrAssetDeeplinkIntent";

const base = {
  categoryParam: null as string | null,
};

const tokenPath = "/ethereum/erc20/usd_tether__erc20_";
const tokenId = "ethereum/erc20/usd_tether__erc20_";

describe("resolveMarketOrAssetDeeplinkIntent", () => {
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

    it("pre-selects a category on the empty market path", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({
          ...base,
          hostname: "market",
          pathname: "/",
          categoryParam: "stocks",
        }),
      ).toEqual({ type: "market-banner", category: "stocks" });
    });

    it("routes an unknown crypto asset id to the market banner", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...base, hostname: "asset", pathname: "/not-a-coin" }),
      ).toEqual({ type: "market-banner" });
    });

    it("routes an empty asset path to portfolio", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({ ...base, hostname: "asset", pathname: "/" }),
      ).toEqual({ type: "portfolio" });
    });

    it("treats an extra-slash path as empty and routes to portfolio", () => {
      expect(
        resolveMarketOrAssetDeeplinkIntent({
          ...base,
          hostname: "asset",
          pathname: "//",
        }),
      ).toEqual({ type: "portfolio" });
    });
  });
});
