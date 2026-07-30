/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import vechainBridge, { getAssetFromToken, getTokenFromAsset } from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

const mockToken = {
  id: "vechain/vip180/vtho",
  tokenType: "vip180",
  contractAddress: "0x0000000000000000000000000000456E65726779",
  name: "VeThor",
  ticker: "VTHO",
  units: [{ name: "VeThor", code: "VTHO", magnitude: 18 }],
} as unknown as TokenCurrency;

const vechain = getCryptoCurrencyById("vechain");

describe("vechain bridge api", () => {
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

    afterEach(() => jest.clearAllMocks());

    it("returns undefined for a native asset", async () => {
      const result = await getTokenFromAsset(vechain, { type: "native" });
      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("returns undefined when the asset has no assetReference", async () => {
      const result = await getTokenFromAsset(vechain, { type: "token" } as AssetInfo);
      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("looks the token up by address in the vechain currency", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const asset: AssetInfo = { type: "token", assetReference: mockToken.contractAddress };

      const result = await getTokenFromAsset(vechain, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        mockToken.contractAddress,
        vechain.id,
      );
      expect(result).toBe(mockToken);
    });

    it("returns undefined when the token is not recognized", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
      const asset: AssetInfo = { type: "token", assetReference: "0xUnknown" };
      expect(await getTokenFromAsset(vechain, asset)).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    const owner = "0x7777777777777777777777777777777777777777";

    it("maps a token to AssetInfo", () => {
      expect(getAssetFromToken(mockToken, owner)).toEqual({
        type: "token",
        assetReference: mockToken.contractAddress,
        assetOwner: owner,
        name: "VeThor",
        unit: mockToken.units[0],
      });
    });
  });

  describe("vechainBridge factory", () => {
    const owner = "0x8888888888888888888888888888888888888888";

    it("wires getTokenFromAsset and getAssetFromToken for the given currency", async () => {
      const mockFindTokenByAddressInCurrency = jest.fn().mockResolvedValue(mockToken);
      (
        jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
          getCryptoAssetsStore: jest.Mock;
        }
      ).getCryptoAssetsStore.mockReturnValue({
        findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
      });

      const bridgeApi = vechainBridge(vechain);

      const result = await bridgeApi.getTokenFromAsset?.({
        type: "token",
        assetReference: mockToken.contractAddress,
      });
      expect(result).toBe(mockToken);
      expect(bridgeApi.getAssetFromToken?.(mockToken, owner)).toEqual({
        type: "token",
        assetReference: mockToken.contractAddress,
        assetOwner: owner,
        name: "VeThor",
        unit: mockToken.units[0],
      });
    });
  });
});
