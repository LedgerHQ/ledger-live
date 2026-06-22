/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import cardanoBridge, { getAssetFromToken, getTokenFromAsset } from "./api";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

jest.mock("@ledgerhq/cryptoassets/state");

const ASSET_REFERENCE = "1234567890123456789012345678901234567890123456789012345a4d59544f4b454e";
const mockToken = {
  id: `cardano/native/${ASSET_REFERENCE}`,
  tokenType: "native",
  contractAddress: ASSET_REFERENCE,
  name: "Coin Tester Token",
  units: [{ name: "Coin Tester Token", code: "CTT", magnitude: 0 }],
} as unknown as TokenCurrency;

const cardano = getCryptoCurrencyById("cardano");

describe("cardano bridge", () => {
  const mockFindTokenByAddressInCurrency = jest.fn() as jest.MockedFunction<
    CryptoAssetsStore["findTokenByAddressInCurrency"]
  >;

  (
    jest.requireMock("@ledgerhq/cryptoassets/state") as { getCryptoAssetsStore: jest.Mock }
  ).getCryptoAssetsStore.mockReturnValue({
    findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTokenFromAsset", () => {
    it("should return undefined for a native asset (no assetReference)", async () => {
      const result = await getTokenFromAsset(cardano, { type: "native" });

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should return undefined when assetReference is empty", async () => {
      const result = await getTokenFromAsset(cardano, {
        type: "native",
        assetReference: "",
      } as AssetInfo);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should look the token up by assetReference + currency id", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);

      await getTokenFromAsset(cardano, { type: "native", assetReference: ASSET_REFERENCE });

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(ASSET_REFERENCE, cardano.id);
    });

    it("should return the token when found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);

      const result = await getTokenFromAsset(cardano, {
        type: "native",
        assetReference: ASSET_REFERENCE,
      });

      expect(result).toBe(mockToken);
    });

    it("should return undefined when the token is not found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);

      const result = await getTokenFromAsset(cardano, {
        type: "native",
        assetReference: "deadbeef",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    const owner = "addr1qxtest";

    it("should map the token to an AssetInfo (type from tokenType, ref from contractAddress)", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toEqual({
        type: "native",
        assetReference: ASSET_REFERENCE,
        assetOwner: owner,
        name: "Coin Tester Token",
        unit: { name: "Coin Tester Token", code: "CTT", magnitude: 0 },
      });
    });
  });

  describe("default bridge", () => {
    it("exposes getTokenFromAsset/getAssetFromToken bound to the currency", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const bridge = cardanoBridge(cardano);

      await bridge.getTokenFromAsset!({ type: "native", assetReference: ASSET_REFERENCE });
      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(ASSET_REFERENCE, cardano.id);

      expect(bridge.getAssetFromToken!(mockToken, "addr1qxtest")).toHaveProperty(
        "assetReference",
        ASSET_REFERENCE,
      );
    });
  });
});
