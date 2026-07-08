import { resolveAssetDeeplinkAction } from "../resolveAssetDeeplinkAction";

const coin = { currencyId: "bitcoin", assetId: "bitcoin" };
const token = {
  currencyId: "ethereum",
  assetId: "ethereum/erc20/usd_tether__erc20_",
  ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
};

describe("resolveAssetDeeplinkAction", () => {
  describe("when aggregated assets are on", () => {
    it("opens asset detail for a coin without market state", () => {
      expect(resolveAssetDeeplinkAction(coin, true)).toEqual({
        kind: "asset-detail",
        currencyId: "bitcoin",
        marketState: undefined,
      });
    });

    it("opens asset detail for a token carrying its market state", () => {
      expect(resolveAssetDeeplinkAction(token, true)).toEqual({
        kind: "asset-detail",
        currencyId: "ethereum/erc20/usd_tether__erc20_",
        marketState: {
          id: "ethereum/erc20/usd_tether__erc20_",
          ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
        },
      });
    });
  });

  describe("when aggregated assets are off", () => {
    it("routes a coin to the legacy currency screen", () => {
      expect(resolveAssetDeeplinkAction(coin, false)).toEqual({
        kind: "legacy-currency",
        currencyId: "bitcoin",
      });
    });

    it("rejects a token id (unsupported on legacy screens)", () => {
      expect(resolveAssetDeeplinkAction(token, false)).toEqual({ kind: "reject" });
    });
  });
});
