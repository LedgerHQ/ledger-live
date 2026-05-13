import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAssetFromToken, getTokenFromAsset } from "./bridge";

beforeAll(() => {
  const stellar = getCryptoCurrencyById("stellar");

  const mockStore: Parameters<typeof setCryptoAssetsStore>[0] = {
    findTokenById: async (id: string) => {
      if (id === "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN") {
        const usdc: TokenCurrency = {
          type: "TokenCurrency",
          id: "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          contractAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          parentCurrency: stellar,
          tokenType: "stellar",
          name: "USDC",
          ticker: "USDC",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "USDC", code: "USDC", magnitude: 7 }],
        };
        return usdc;
      }
      return undefined;
    },
    findTokenByAddressInCurrency: async (_address: string, _currencyId: string) => {
      return undefined;
    },
    getTokensSyncHash: async () => "",
  };

  setCryptoAssetsStore(mockStore);
});

describe("generic-coin-framework stellar token", () => {
  describe("stellar token helpers", () => {
    it("computes the token of a known asset", async () => {
      await expect(
        getTokenFromAsset({
          type: "token",
          assetReference: "USDC",
          assetOwner: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        }),
      ).resolves.toMatchObject({
        id: "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        contractAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        name: "USDC",
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

    it("computes the asset of a stellar token", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        parentCurrency: getCryptoCurrencyById("stellar"),
        tokenType: "stellar",
        contractAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        name: "USDC",
        ticker: "USDC",
        delisted: false,
        disableCountervalue: false,
        units: [{ name: "USDC", code: "usdc", magnitude: 7 }],
      };

      expect(getAssetFromToken(token)).toEqual({
        assetOwner: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        assetReference: "USDC",
        name: "USDC",
        type: "stellar",
        unit: {
          code: "usdc",
          magnitude: 7,
          name: "USDC",
        },
      });
    });

    it("does not use an owner argument when computing stellar assets", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        parentCurrency: getCryptoCurrencyById("stellar"),
        tokenType: "stellar",
        contractAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        name: "USDC",
        ticker: "USDC",
        delisted: false,
        disableCountervalue: false,
        units: [{ name: "USDC", code: "USDC", magnitude: 7 }],
      };

      expect(getAssetFromToken(token)).toEqual({
        assetOwner: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        assetReference: "USDC",
        name: "USDC",
        type: "stellar",
        unit: {
          code: "USDC",
          magnitude: 7,
          name: "USDC",
        },
      });
    });
  });
});
