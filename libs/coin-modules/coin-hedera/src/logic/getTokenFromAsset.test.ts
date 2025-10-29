import { getTokenFromAsset } from "./getTokenFromAsset";
import { getMockedCurrency, getMockedTokenCurrency } from "../test/fixtures/currency.fixture";
import * as cryptoAssets from "@ledgerhq/coin-framework/crypto-assets/index";

jest.mock("@ledgerhq/coin-framework/crypto-assets/index");

describe("getTokenFromAsset", () => {
  const mockCurrency = getMockedCurrency();
  const mockToken = getMockedTokenCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns token from token asset", async () => {
    const asset1 = { type: "hts", assetReference: mockToken.contractAddress };

    (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockReturnValue(mockToken),
    });

    const result = await getTokenFromAsset(mockCurrency, asset1);
    expect(result).toEqual(mockToken);
    expect(result?.id).toBe(mockToken.id);
    expect(result?.contractAddress).toBe(mockToken.contractAddress);
  });

  it("returns undefined for native asset", async () => {
    const nativeAsset = { type: "native" };

    expect(await getTokenFromAsset(mockCurrency, nativeAsset)).toBeUndefined();
  });
});
