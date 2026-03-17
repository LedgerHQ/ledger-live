/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAssetFromToken, getTokenFromAsset } from "../getTokenFromAsset";

jest.mock("@ledgerhq/cryptoassets/state");

const mockFindTokenByAddressInCurrency = jest.fn();

const { getCryptoAssetsStore } = jest.requireMock("@ledgerhq/cryptoassets/state") as {
  getCryptoAssetsStore: jest.Mock;
};

getCryptoAssetsStore.mockReturnValue({
  findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
});

const CURRENCY_ID = "solana";

const mockToken = {
  id: "solana/spl/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  tokenType: "spl",
  contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  name: "USD Coin",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as unknown as TokenCurrency;

describe("getTokenFromAsset", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return undefined when asset type is native", async () => {
    const asset: AssetInfo = { type: "native" };

    const result = await getTokenFromAsset(CURRENCY_ID, asset);

    expect(result).toBeUndefined();
    expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
  });

  it("should return undefined when asset has no assetReference", async () => {
    const asset = { type: "spl" } as AssetInfo;

    const result = await getTokenFromAsset(CURRENCY_ID, asset);

    expect(result).toBeUndefined();
    expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
  });

  it("should call findTokenByAddressInCurrency with correct arguments", async () => {
    mockFindTokenByAddressInCurrency.mockReturnValue(mockToken);
    const asset: AssetInfo = {
      type: "spl",
      assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    };

    await getTokenFromAsset(CURRENCY_ID, asset);

    expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      CURRENCY_ID,
    );
  });

  it("should return the token when found", async () => {
    mockFindTokenByAddressInCurrency.mockReturnValue(mockToken);
    const asset: AssetInfo = {
      type: "spl",
      assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    };

    const result = await getTokenFromAsset(CURRENCY_ID, asset);

    expect(result).toBe(mockToken);
  });

  it("should return undefined when token is not found", async () => {
    mockFindTokenByAddressInCurrency.mockReturnValue(undefined);
    const asset: AssetInfo = {
      type: "spl",
      assetReference: "UnknownMintAddress1111111111111111111111111",
    };

    const result = await getTokenFromAsset(CURRENCY_ID, asset);

    expect(result).toBeUndefined();
  });
});

describe("getAssetFromToken", () => {
  const owner = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

  it("should return correct AssetInfo with all fields mapped properly", () => {
    const result = getAssetFromToken(mockToken, owner);

    expect(result).toEqual({
      type: "spl",
      assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      assetOwner: owner,
      name: "USD Coin",
      unit: { name: "USDC", code: "USDC", magnitude: 6 },
    });
  });

  it("should use token.tokenType for type", () => {
    const result = getAssetFromToken(mockToken, owner);

    expect(result.type).toBe(mockToken.tokenType);
  });

  it("should use token.contractAddress for assetReference", () => {
    const result = getAssetFromToken(mockToken, owner);

    expect(result).toHaveProperty("assetReference", mockToken.contractAddress);
  });

  it("should pass owner as assetOwner", () => {
    const result = getAssetFromToken(mockToken, owner);

    expect(result).toHaveProperty("assetOwner", owner);
  });

  it("should use token.units[0] for unit", () => {
    const result = getAssetFromToken(mockToken, owner);

    expect(result.unit).toBe(mockToken.units[0]);
  });

  it("should use token.name for name", () => {
    const result = getAssetFromToken(mockToken, owner);

    expect(result.name).toBe(mockToken.name);
  });
});
