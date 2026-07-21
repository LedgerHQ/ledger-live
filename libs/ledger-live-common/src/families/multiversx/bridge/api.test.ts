/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAssetFromToken, getTokenFromAsset, computeIntentType } from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

const mockToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "elrond/esdt/555344432d633736663166",
  tokenType: "esdt",
  contractAddress: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
  name: "WrappedUSDC",
  ticker: "USDC",
  parentCurrencyId: "elrond",
  units: [{ name: "WrappedUSDC", code: "USDC", magnitude: 6 }],
};

const multiversx = getCryptoCurrencyById("elrond");

describe("multiversx bridge", () => {
  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
      [{ mode: "delegate" }, "delegate"],
      [{ mode: "unDelegate" }, "unDelegate"],
      [{ mode: "claimRewards" }, "claimRewards"],
      [{ mode: "withdraw" }, "withdraw"],
      [{ mode: "reDelegateRewards" }, "reDelegateRewards"],
    ])("maps %o to %s", (transaction, expected) => {
      expect(computeIntentType(transaction)).toBe(expected);
    });

    it("throws for an unsupported mode", () => {
      expect(() => computeIntentType({ mode: "swap" })).toThrow(
        "Unsupported MultiversX transaction mode: swap",
      );
    });
  });

  describe("getTokenFromAsset", () => {
    const mockFindTokenByAddressInCurrency = jest.fn() as jest.MockedFunction<
      CryptoAssetsStore["findTokenByAddressInCurrency"]
    >;

    (
      jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
        getCryptoAssetsStore: jest.Mock;
      }
    ).getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("returns undefined when asset type is native", async () => {
      const asset: AssetInfo = { type: "native" };

      const result = await getTokenFromAsset(multiversx, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("returns undefined when asset has no assetReference", async () => {
      const asset = { type: "esdt" } as AssetInfo;

      const result = await getTokenFromAsset(multiversx, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("calls findTokenByAddressInCurrency with ESDT SC + identifier", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const asset: AssetInfo = {
        type: "esdt",
        assetReference: "USDC-c76f1f",
        assetOwner: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
      };

      const result = await getTokenFromAsset(multiversx, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
        multiversx.id,
        "USDC-c76f1f",
      );
      expect(result).toBe(mockToken);
    });

    it("returns undefined when token is not found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
      const asset: AssetInfo = {
        type: "esdt",
        assetReference: "UNKNOWN-000000",
        assetOwner: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
      };

      const result = await getTokenFromAsset(multiversx, asset);

      expect(result).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    it("returns correct AssetInfo with all fields mapped properly", () => {
      const result = getAssetFromToken(mockToken);

      expect(result).toEqual({
        type: "esdt",
        assetReference: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
        assetOwner: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
        name: "WrappedUSDC",
        unit: { name: "WrappedUSDC", code: "USDC", magnitude: 6 },
      });
    });

    it("uses token.tokenType for type", () => {
      const result = getAssetFromToken(mockToken);

      expect(result.type).toBe(mockToken.tokenType);
    });

    it("uses ESDT system SC as assetOwner", () => {
      const result = getAssetFromToken(mockToken);

      expect(result).toHaveProperty(
        "assetOwner",
        "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
      );
    });

    it("uses token.units[0] for unit", () => {
      const result = getAssetFromToken(mockToken);

      expect(result.unit).toBe(mockToken.units[0]);
    });

    it("uses token.name for name", () => {
      const result = getAssetFromToken(mockToken);

      expect(result.name).toBe(mockToken.name);
    });
  });
});
