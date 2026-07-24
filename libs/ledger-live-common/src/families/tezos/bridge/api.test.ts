import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@domain/entity-currency";
import { TokenCurrencySchema } from "@domain/entity-currency";
import { computeIntentType, getAssetFromToken, getTokenFromAsset } from "./api";

beforeAll(() => {
  const mockStore: Parameters<typeof setCryptoAssetsStore>[0] = {
    findTokenById: async (_id: string) => {
      return undefined;
    },
    findTokenByAddressInCurrency: async (
      address: string,
      currencyId: string,
      tokenIdentifier?: string,
    ) => {
      if (
        address === "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o" &&
        currencyId === "tezos" &&
        tokenIdentifier === "0"
      ) {
        const usdt: TokenCurrency = {
          type: "TokenCurrency",
          id: TokenCurrencySchema.shape.id.parse(
            "tezos/fa2/tether_usd_kt1xntn74butxhfdtbmm2bgzaqfhpbvkwr8o",
          ),
          contractAddress: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o",
          parentCurrencyId: TokenCurrencySchema.shape.parentCurrencyId.parse("tezos"),
          tokenType: "fa2",
          name: "Tether USD",
          ticker: "USDt",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "Tether USD", code: "USDt", magnitude: 6 }],
        };
        return usdt;
      }
      if (
        address === "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ" &&
        currencyId === "tezos" &&
        tokenIdentifier === "17"
      ) {
        const wusdc: TokenCurrency = {
          type: "TokenCurrency",
          id: TokenCurrencySchema.shape.id.parse(
            "tezos/fa2/wrapped_usdc_kt18fp5rctw7mbwdmzfwjlduhs5mejmagdsz_17",
          ),
          contractAddress: "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ",
          parentCurrencyId: TokenCurrencySchema.shape.parentCurrencyId.parse("tezos"),
          tokenType: "fa2",
          name: "Wrapped USDC",
          ticker: "wUSDC",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "Wrapped USDC", code: "wUSDC", magnitude: 6 }],
        };
        return wusdc;
      }
      return undefined;
    },
    getTokensSyncHash: async () => "",
  };

  setCryptoAssetsStore(mockStore);
});

describe("generic-coin-framework Tezos token", () => {
  describe("Tezos token helpers", () => {
    it("resolves a single-asset FA2 token by contract:tokenId", async () => {
      await expect(
        getTokenFromAsset({
          type: "token",
          assetReference: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o:0",
          assetOwner: "tz1VUmqS38E45KZevtphpVF4cKiK1YJ1P9eL",
        }),
      ).resolves.toMatchObject({
        type: "TokenCurrency",
        id: TokenCurrencySchema.shape.id.parse(
          "tezos/fa2/tether_usd_kt1xntn74butxhfdtbmm2bgzaqfhpbvkwr8o",
        ),
        contractAddress: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o",
        parentCurrencyId: TokenCurrencySchema.shape.parentCurrencyId.parse("tezos"),
        tokenType: "fa2",
        name: "Tether USD",
        ticker: "USDt",
      });
    });

    it("resolves a multi-asset FA2 token by contract:tokenId", async () => {
      await expect(
        getTokenFromAsset({
          type: "token",
          assetReference: "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ:17",
          assetOwner: "tz1VUmqS38E45KZevtphpVF4cKiK1YJ1P9eL",
        }),
      ).resolves.toMatchObject({
        id: TokenCurrencySchema.shape.id.parse(
          "tezos/fa2/wrapped_usdc_kt18fp5rctw7mbwdmzfwjlduhs5mejmagdsz_17",
        ),
        name: "Wrapped USDC",
        ticker: "wUSDC",
      });
    });

    it("does not compute the token of an unknown asset", async () => {
      await expect(
        getTokenFromAsset({
          type: "token",
          assetReference: "unknown-reference:0",
          assetOwner: "unknown-owner",
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe("computeIntentType", () => {
    it.each(["delegate", "undelegate", "stake", "unstake", "finalize_unstake", "send"] as const)(
      "returns '%s' unchanged",
      mode => {
        expect(computeIntentType({ mode })).toBe(mode);
      },
    );

    it("returns 'send' when mode is absent", () => {
      expect(computeIntentType({})).toBe("send");
    });

    it("throws for unsupported string modes", () => {
      expect(() => computeIntentType({ mode: "changeTrust" })).toThrow(
        "Unsupported transaction mode: changeTrust",
      );
    });

    it("throws when mode is a non-string value", () => {
      expect(() => computeIntentType({ mode: 42 })).toThrow("Unsupported transaction mode: 42");
    });
  });

  describe("getAssetFromToken", () => {
    it("produces assetReference with :0 for single-asset tokens", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: TokenCurrencySchema.shape.id.parse(
          "tezos/fa2/tether_usd_kt1xntn74butxhfdtbmm2bgzaqfhpbvkwr8o",
        ),
        contractAddress: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o",
        parentCurrencyId: TokenCurrencySchema.shape.parentCurrencyId.parse("tezos"),
        tokenType: "fa2",
        name: "Tether USD",
        ticker: "USDt",
        delisted: false,
        disableCountervalue: false,
        units: [{ name: "Tether USD", code: "USDt", magnitude: 6 }],
      };

      expect(getAssetFromToken(token, "tz1owner")).toEqual({
        type: "fa2",
        assetReference: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o:0",
        assetOwner: "tz1owner",
        name: "Tether USD",
        unit: { name: "Tether USD", code: "USDt", magnitude: 6 },
      });
    });

    it("produces assetReference with :tokenId for multi-asset tokens", () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: TokenCurrencySchema.shape.id.parse(
          "tezos/fa2/wrapped_usdc_kt18fp5rctw7mbwdmzfwjlduhs5mejmagdsz_17",
        ),
        contractAddress: "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ",
        parentCurrencyId: TokenCurrencySchema.shape.parentCurrencyId.parse("tezos"),
        tokenType: "fa2",
        name: "Wrapped USDC",
        ticker: "wUSDC",
        delisted: false,
        disableCountervalue: false,
        units: [{ name: "Wrapped USDC", code: "wUSDC", magnitude: 6 }],
      };

      expect(getAssetFromToken(token, "tz1owner")).toEqual({
        type: "fa2",
        assetReference: "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ:17",
        assetOwner: "tz1owner",
        name: "Wrapped USDC",
        unit: { name: "Wrapped USDC", code: "wUSDC", magnitude: 6 },
      });
    });

    it("round-trips: getAssetFromToken → getTokenFromAsset", async () => {
      const token: TokenCurrency = {
        type: "TokenCurrency",
        id: TokenCurrencySchema.shape.id.parse(
          "tezos/fa2/wrapped_usdc_kt18fp5rctw7mbwdmzfwjlduhs5mejmagdsz_17",
        ),
        contractAddress: "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ",
        parentCurrencyId: TokenCurrencySchema.shape.parentCurrencyId.parse("tezos"),
        tokenType: "fa2",
        name: "Wrapped USDC",
        ticker: "wUSDC",
        delisted: false,
        disableCountervalue: false,
        units: [{ name: "Wrapped USDC", code: "wUSDC", magnitude: 6 }],
      };

      const asset = getAssetFromToken(token, "tz1owner");
      const resolved = await getTokenFromAsset(asset);
      expect(resolved?.id).toBe(token.id);
    });
  });
});
