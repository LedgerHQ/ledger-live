/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import cardanoBridge, { getAssetFromToken, getTokenFromAsset } from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

const POLICY_ID = "12345678901234567890123456789012345678901234567890123456";
const ASSET_NAME = "4d59544f4b454e";
const ASSET_REFERENCE = `${POLICY_ID}${ASSET_NAME}`;

// Shaped as CAL serves it: contractAddress holds the policyId, tokenIdentifier the assetName.
const mockToken = {
  id: `cardano/native/${ASSET_REFERENCE}`,
  tokenType: "native",
  contractAddress: POLICY_ID,
  tokenIdentifier: ASSET_NAME,
  name: "Coin Tester Token",
  units: [{ name: "Coin Tester Token", code: "CTT", magnitude: 0 }],
} as unknown as TokenCurrency;

const mockEmptyNameToken = {
  id: `cardano/native/${POLICY_ID}`,
  tokenType: "native",
  contractAddress: POLICY_ID,
  name: "Empty Name Token",
  units: [{ name: "Empty Name Token", code: "ENT", magnitude: 0 }],
} as unknown as TokenCurrency;

const cardano = getCryptoCurrencyById("cardano");

describe("cardano bridge", () => {
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

    it("should look the token up by policyId + currency id + assetName", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);

      await getTokenFromAsset(cardano, { type: "native", assetReference: ASSET_REFERENCE });

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        POLICY_ID,
        cardano.id,
        ASSET_NAME,
      );
    });

    it("should pass no tokenIdentifier when the assetName is empty", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockEmptyNameToken);

      await getTokenFromAsset(cardano, { type: "native", assetReference: POLICY_ID });

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        POLICY_ID,
        cardano.id,
        undefined,
      );
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

    it("should map the token to an AssetInfo with the full <policyId><assetName> reference", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toEqual({
        type: "native",
        assetReference: ASSET_REFERENCE,
        assetOwner: owner,
      });
    });

    it("should use the policyId alone as reference when the assetName is empty", () => {
      expect(getAssetFromToken(mockEmptyNameToken, owner)).toHaveProperty(
        "assetReference",
        POLICY_ID,
      );
    });
  });

  describe("round trip", () => {
    it.each([
      ["a non-empty assetName", mockToken],
      ["an empty assetName", mockEmptyNameToken],
    ])("getTokenFromAsset(getAssetFromToken(token)) resolves a token with %s", async (_, token) => {
      mockFindTokenByAddressInCurrency.mockImplementation(
        async (address, currencyId, identifier) =>
          currencyId === cardano.id &&
          address === token.contractAddress &&
          identifier === token.tokenIdentifier
            ? token
            : undefined,
      );

      const result = await getTokenFromAsset(cardano, getAssetFromToken(token, "addr1qxtest"));

      expect(result).toBe(token);
    });
  });

  describe("default bridge", () => {
    it("exposes getTokenFromAsset/getAssetFromToken bound to the currency", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const bridge = cardanoBridge(cardano);

      await bridge.getTokenFromAsset!({ type: "native", assetReference: ASSET_REFERENCE });
      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        POLICY_ID,
        cardano.id,
        ASSET_NAME,
      );

      expect(bridge.getAssetFromToken!(mockToken, "addr1qxtest")).toHaveProperty(
        "assetReference",
        ASSET_REFERENCE,
      );
    });
  });
});
