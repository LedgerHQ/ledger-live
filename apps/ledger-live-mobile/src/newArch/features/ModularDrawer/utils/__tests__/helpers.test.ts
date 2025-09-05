import { getNetworksForAsset, resolveCurrency } from "../helpers";
import type { AssetsData } from "../../hooks/useAssetsFromDada";
import {
  mockEthCryptoCurrency,
  mockBtcCryptoCurrency,
  mockBaseCryptoCurrency,
  usdcToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

describe("helpers", () => {
  describe("getNetworksForAsset", () => {
    it("should return an empty array if the asset id does not exist", () => {
      const assets: AssetsData = [
        {
          asset: { id: "a1", ticker: "A1", name: "Asset 1", assetsIds: {} },
          networks: [mockEthCryptoCurrency],
        },
      ];
      expect(getNetworksForAsset(assets, "unknown")).toEqual([]);
    });

    it("should return the networks for a matching asset id", () => {
      const networks = [mockEthCryptoCurrency, mockBtcCryptoCurrency];
      const assets: AssetsData = [
        {
          asset: { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} },
          networks,
        },
      ];
      expect(getNetworksForAsset(assets, "btc")).toBe(networks);
    });
  });

  describe("resolveCurrency", () => {
    const eth = mockEthCryptoCurrency;
    const base = mockBaseCryptoCurrency;
    const usdc = usdcToken;

    const assets: AssetsData = [
      {
        asset: { id: eth.id, name: eth.name, ticker: eth.ticker, assetsIds: {} },
        networks: [eth, usdc],
      },
      {
        asset: { id: base.id, name: base.name, ticker: base.ticker, assetsIds: {} },
        networks: [base, usdc],
      },
    ];

    it("should return undefined if no asset is selected", () => {
      expect(resolveCurrency(assets, undefined, undefined)).toBeUndefined();
    });

    it("should return the selected asset if no network is selected", () => {
      expect(resolveCurrency(assets, eth, undefined)).toBe(eth);
    });

    it("should return the selected asset when the selected network is the same currency", () => {
      expect(resolveCurrency(assets, eth, eth)).toBe(eth);
    });

    it("should return the token correctly for both parent and other networks", () => {
      // Token selected with its parent network
      expect(resolveCurrency(assets, usdc, eth)).toBe(usdc);

      // Token selected with a different network
      expect(resolveCurrency(assets, usdc, base)).toBe(usdc);
    });
  });
});
