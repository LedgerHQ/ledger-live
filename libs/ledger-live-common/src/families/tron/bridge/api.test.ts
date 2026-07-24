/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { getAssetFromToken, getTokenFromAsset, computeIntentType } from "./api";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

const trc20Token = {
  id: "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
  tokenType: "trc20",
  contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  name: "Tether USD",
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
} as unknown as TokenCurrency;

const trc10Token = {
  id: "tron/trc10/1002000",
  tokenType: "trc10",
  contractAddress: "1002000",
  name: "BitTorrent",
  units: [{ name: "BTT", code: "BTT", magnitude: 6 }],
} as unknown as TokenCurrency;

const tron = getCryptoCurrencyById("tron");

describe("tron bridge", () => {
  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
    ])("should map %o to %s", (transaction, expected) => {
      expect(computeIntentType(transaction)).toBe(expected);
    });

    it("should throw for an unsupported mode", () => {
      expect(() => computeIntentType({ mode: "freeze" })).toThrow(
        "Unsupported Tron transaction mode: freeze",
      );
    });
  });

  describe("getTokenFromAsset", () => {
    const mockFindTokenByAddressInCurrency = jest.fn() as jest.MockedFunction<
      CryptoAssetsStore["findTokenByAddressInCurrency"]
    >;
    const mockFindTokenById = jest.fn() as jest.MockedFunction<CryptoAssetsStore["findTokenById"]>;

    (
      jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
        getCryptoAssetsStore: jest.Mock;
      }
    ).getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
      findTokenById: mockFindTokenById,
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return undefined when asset type is native", async () => {
      const asset: AssetInfo = { type: "native" };

      const result = await getTokenFromAsset(tron, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should return undefined when asset has no assetReference", async () => {
      const asset = { type: "trc20" } as AssetInfo;

      const result = await getTokenFromAsset(tron, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should resolve a TRC20 token by its contract address", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(trc20Token);
      const asset: AssetInfo = {
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      };

      const result = await getTokenFromAsset(tron, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        tron.id,
      );
      expect(result).toBe(trc20Token);
    });

    it("should resolve a TRC10 token by its id (mirrors the legacy synchronization lookup)", async () => {
      mockFindTokenById.mockResolvedValue(trc10Token);
      const asset: AssetInfo = { type: "trc10", assetReference: "1002000" };

      const result = await getTokenFromAsset(tron, asset);

      expect(mockFindTokenById).toHaveBeenCalledWith(`${tron.id}/trc10/1002000`);
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
      expect(result).toBe(trc10Token);
    });

    it("should return undefined when token is not found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
      const asset: AssetInfo = { type: "trc20", assetReference: "UnknownContract" };

      const result = await getTokenFromAsset(tron, asset);

      expect(result).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    const owner = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";

    it("should map a TRC20 token to AssetInfo", () => {
      const result = getAssetFromToken(trc20Token, owner);

      expect(result).toEqual({
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        assetOwner: owner,
        name: "Tether USD",
        unit: { name: "USDT", code: "USDT", magnitude: 6 },
      });
    });

    it("should map a TRC10 token to AssetInfo using its asset id as assetReference", () => {
      const result = getAssetFromToken(trc10Token, owner);

      expect(result).toEqual({
        type: "trc10",
        assetReference: "1002000",
        assetOwner: owner,
        name: "BitTorrent",
        unit: { name: "BTT", code: "BTT", magnitude: 6 },
      });
    });
  });
});
