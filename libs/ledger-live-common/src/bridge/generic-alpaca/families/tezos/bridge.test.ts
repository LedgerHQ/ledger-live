import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getTokenFromAsset } from "./bridge";

beforeAll(() => {
  const tezos = getCryptoCurrencyById("tezos");
  const mockStore: Parameters<typeof setCryptoAssetsStore>[0] = {
    findTokenById: async (_id: string) => {
      return undefined;
    },
    findTokenByAddressInCurrency: async (token: string, currencyId: string) => {
      if (token === "USDt" && currencyId === "tezos") {
        const usdc: TokenCurrency = {
          type: "TokenCurrency",
          id: "tezos/fa2/tether_usd_kt1xntn74butxhfdtbmm2bgzaqfhpbvkwr8o",
          contractAddress: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o",
          parentCurrency: tezos,
          tokenType: "fa2",
          name: "Tether USD",
          ticker: "USDt",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "Tether USD", code: "USDt", magnitude: 6 }],
        };
        return usdc;
      }
      return undefined;
    },
    getTokensSyncHash: async () => "",
  };

  setCryptoAssetsStore(mockStore);
});

describe("generic-alpaca Tezos token", () => {
  describe("Tezos token helpers", () => {
    it("computes the token of a known asset", async () => {
      const tezos = getCryptoCurrencyById("tezos");
      await expect(
        getTokenFromAsset({
          type: "token",
          assetReference: "USDt",
          assetOwner: "tz1VUmqS38E45KZevtphpVF4cKiK1YJ1P9eL",
        }),
      ).resolves.toMatchObject({
        type: "TokenCurrency",
        id: "tezos/fa2/tether_usd_kt1xntn74butxhfdtbmm2bgzaqfhpbvkwr8o",
        contractAddress: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o",
        parentCurrency: tezos,
        tokenType: "fa2",
        name: "Tether USD",
        ticker: "USDt",
        delisted: false,
        disableCountervalue: false,
        units: [{ name: "Tether USD", code: "USDt", magnitude: 6 }],
      });
    });

    it("does not compute the token of an unknown asset", async () => {
      await expect(
        getTokenFromAsset({
          type: "token",
          assetReference: "unknown-reference",
          assetOwner: "unknown-owner",
        }),
      ).resolves.toBeUndefined();
    });
  });
});
