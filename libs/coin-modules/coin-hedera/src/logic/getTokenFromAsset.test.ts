import { getTokenFromAsset } from "./getTokenFromAsset";
import { getMockedCurrency, getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

setupMockCryptoAssetsStore();

describe("getTokenFromAsset", () => {
  const mockCurrency = getMockedCurrency();
  const mockToken = getMockedHTSTokenCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns token from token asset", async () => {
    const asset1 = { type: "hts", assetReference: mockToken.contractAddress };

    const findTokenByAddressInCurrencyMock = jest.fn().mockResolvedValue(mockToken);

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
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
