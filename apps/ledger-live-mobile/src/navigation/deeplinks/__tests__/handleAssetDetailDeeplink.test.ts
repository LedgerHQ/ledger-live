import { NavigatorName, ScreenName } from "~/const";
import { handleAssetDetailDeeplink } from "../handleAssetDetailDeeplink";

describe("handleAssetDetailDeeplink", () => {
  describe("navigation shape", () => {
    it("returns navigation state targeting AssetDetail nested under BaseNavigator", () => {
      const result = handleAssetDetailDeeplink({
        currencyId: "bitcoin",
        source: "deeplink_asset",
      });

      expect(result).toEqual({
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.AssetDetail,
                  state: {
                    routes: [
                      {
                        name: ScreenName.AssetDetail,
                        params: { currencyId: "bitcoin", source: "deeplink_asset" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("places Main at index 0 so back press returns to Main instead of exiting the app", () => {
      const result = handleAssetDetailDeeplink({
        currencyId: "ethereum",
        source: "deeplink_market",
      });

      const baseState = result?.routes[0].state;
      expect(baseState?.index).toBe(1);
      expect(baseState?.routes[0]).toEqual({ name: NavigatorName.Main });
    });
  });

  describe("params propagation", () => {
    it("forwards currencyId to the AssetDetail screen params", () => {
      const result = handleAssetDetailDeeplink({
        currencyId: "solana",
        source: "deeplink_asset",
      });

      const assetDetailRoute = result?.routes[0].state?.routes[1];
      const screenRoute = assetDetailRoute?.state?.routes[0];
      expect(screenRoute?.name).toBe(ScreenName.AssetDetail);
      expect(screenRoute?.params).toMatchObject({ currencyId: "solana" });
    });

    it("forwards source='deeplink_asset' to params for the asset hostname flow", () => {
      const result = handleAssetDetailDeeplink({
        currencyId: "bitcoin",
        source: "deeplink_asset",
      });

      const screenRoute = result?.routes[0].state?.routes[1]?.state?.routes[0];
      expect(screenRoute?.params).toMatchObject({ source: "deeplink_asset" });
    });

    it("forwards source='deeplink_market' to params for the market hostname flow", () => {
      const result = handleAssetDetailDeeplink({
        currencyId: "bitcoin",
        source: "deeplink_market",
      });

      const screenRoute = result?.routes[0].state?.routes[1]?.state?.routes[0];
      expect(screenRoute?.params).toMatchObject({ source: "deeplink_market" });
    });
  });
});
