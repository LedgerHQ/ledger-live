import { getNetworksForAsset, resolveCurrency } from "../helpers";
import type { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import {
  mockEthCryptoCurrency,
  mockBtcCryptoCurrency,
  mockBaseCryptoCurrency,
  usdcToken,
  mockScrollCryptoCurrency,
  maticEth,
  maticBsc,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("helpers", () => {
  const acceptAll = () => true;
  const rejectScroll = (currency: CryptoOrTokenCurrency) => currency.id !== "scroll";

  describe("getNetworksForAsset", () => {
    it("should return an empty array if the asset id does not exist", () => {
      const assets: AssetData[] = [
        {
          asset: { id: "a1", ticker: "A1", name: "Asset 1", assetsIds: {} },
          networks: [mockEthCryptoCurrency],
        },
      ];
      expect(getNetworksForAsset(assets, "unknown", acceptAll)).toEqual([]);
    });

    it("should return the networks for a matching asset id", () => {
      const networks = [mockEthCryptoCurrency, mockBtcCryptoCurrency];
      const assets: AssetData[] = [
        {
          asset: { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} },
          networks,
        },
      ];
      expect(getNetworksForAsset(assets, "btc", acceptAll)).toEqual(networks);
    });
    it("should not return scroll network (when deactivated) for asset", () => {
      const networks = [mockEthCryptoCurrency];
      const assets: AssetData[] = [
        {
          asset: { id: "eth", ticker: "ETH", name: "Ethereum", assetsIds: {} },
          networks: [mockEthCryptoCurrency, mockScrollCryptoCurrency],
        },
      ];
      expect(getNetworksForAsset(assets, "eth", rejectScroll)).toEqual(networks);
    });
  });

  describe("resolveCurrency", () => {
    const eth = mockEthCryptoCurrency;
    const base = mockBaseCryptoCurrency;
    const usdc = usdcToken;

    const assets: AssetData[] = [
      {
        asset: { id: eth.id, name: eth.name, ticker: eth.ticker, assetsIds: {} },
        networks: [eth, usdc],
      },
      {
        asset: { id: base.id, name: base.name, ticker: base.ticker, assetsIds: {} },
        networks: [base, usdc],
      },
      {
        asset: {
          id: "ethereum/erc20/matic",
          ticker: "MATIC",
          name: "Matic",
          assetsIds: {
            ethereum: maticEth.id,
            bsc: maticBsc.id,
          },
        },
        networks: [maticEth, maticBsc],
      },
    ];

    it("should return undefined if no asset is selected", () => {
      expect(resolveCurrency(assets, acceptAll, undefined, undefined)).toBeUndefined();
    });

    it("should return the selected asset if no network is selected", () => {
      expect(resolveCurrency(assets, acceptAll, eth, undefined)).toBe(eth);
    });

    it("should return the selected asset when the selected network is the same currency", () => {
      expect(resolveCurrency(assets, acceptAll, eth, eth)).toBe(eth);
    });

    it("should return the token correctly for both parent and other networks", () => {
      // Token selected with its parent network
      expect(resolveCurrency(assets, acceptAll, usdc, eth)).toBe(usdc);

      // Token selected with a different network
      expect(resolveCurrency(assets, acceptAll, usdc, base)).toBe(usdc);

      expect(resolveCurrency(assets, acceptAll, usdc, base)).toBe(usdc);
    });

    it("should return the MATIC token on BNB network correctly", () => {
      // MATIC on ETH selected with Ethereum as parent network
      expect(resolveCurrency(assets, acceptAll, maticEth, eth)).toBe(maticEth);

      // MATIC on BSC selected with BSC parent network
      expect(resolveCurrency(assets, acceptAll, maticBsc, maticBsc)).toBe(maticBsc);
    });
  });
});
