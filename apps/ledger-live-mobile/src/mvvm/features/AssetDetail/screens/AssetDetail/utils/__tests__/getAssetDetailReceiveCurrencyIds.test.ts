import {
  mockBtcCryptoCurrency,
  usdcToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAssetDetailReceiveCurrencyIds } from "../getAssetDetailReceiveCurrencyIds";

type AssetDetailReceiveAssetData = NonNullable<
  Parameters<typeof getAssetDetailReceiveCurrencyIds>[1]
>;

const polygonUsdcToken: TokenCurrency = {
  ...usdcToken,
  id: "polygon/erc20/usd_coin",
};

function assetData(
  cryptoAssets: AssetDetailReceiveAssetData["cryptoAssets"],
): AssetDetailReceiveAssetData {
  return {
    cryptoAssets,
  };
}

describe("getAssetDetailReceiveCurrencyIds", () => {
  it("returns undefined when there is no asset currency", () => {
    expect(getAssetDetailReceiveCurrencyIds(undefined, undefined)).toBeUndefined();
  });

  it("falls back to the current currency id when DADA has no asset data", () => {
    expect(getAssetDetailReceiveCurrencyIds(mockBtcCryptoCurrency, undefined)).toEqual([
      mockBtcCryptoCurrency.id,
    ]);
  });

  it("returns the single currency id for a single-network asset", () => {
    expect(
      getAssetDetailReceiveCurrencyIds(
        mockBtcCryptoCurrency,
        assetData({
          bitcoin: {
            id: "bitcoin",
            ticker: "BTC",
            name: "Bitcoin",
            assetsIds: {
              bitcoin: "bitcoin",
            },
          },
        }),
      ),
    ).toEqual(["bitcoin"]);
  });

  it("returns all DADA asset ids for a multi-network token", () => {
    expect(
      getAssetDetailReceiveCurrencyIds(
        usdcToken,
        assetData({
          "urn:crypto:meta-currency:usd_coin": {
            id: "urn:crypto:meta-currency:usd_coin",
            ticker: "USDC",
            name: "USD Coin",
            assetsIds: {
              ethereum: usdcToken.id,
              polygon: polygonUsdcToken.id,
            },
          },
        }),
      ),
    ).toEqual([usdcToken.id, polygonUsdcToken.id]);
  });

  it("selects the DADA asset whose assetsIds contain the current currency id", () => {
    expect(
      getAssetDetailReceiveCurrencyIds(
        usdcToken,
        assetData({
          bitcoin: {
            id: "bitcoin",
            ticker: "BTC",
            name: "Bitcoin",
            assetsIds: {
              bitcoin: "bitcoin",
            },
          },
          "urn:crypto:meta-currency:usd_coin": {
            id: "urn:crypto:meta-currency:usd_coin",
            ticker: "USDC",
            name: "USD Coin",
            assetsIds: {
              ethereum: usdcToken.id,
              polygon: polygonUsdcToken.id,
            },
          },
        }),
      ),
    ).toEqual([usdcToken.id, polygonUsdcToken.id]);
  });

  it("falls back to the first DADA asset when the current id is absent", () => {
    expect(
      getAssetDetailReceiveCurrencyIds(
        usdcToken,
        assetData({
          "urn:crypto:meta-currency:usd_coin": {
            id: "urn:crypto:meta-currency:usd_coin",
            ticker: "USDC",
            name: "USD Coin",
            assetsIds: {
              polygon: polygonUsdcToken.id,
            },
          },
        }),
      ),
    ).toEqual([polygonUsdcToken.id]);
  });
});
