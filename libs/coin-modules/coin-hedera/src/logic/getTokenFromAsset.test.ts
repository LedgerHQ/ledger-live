import { getTokenFromAsset } from "./getTokenFromAsset";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";

describe("getTokenFromAsset", () => {
  const mockCurrency = getMockedCurrency();

  it("returns token from USDC asset", async () => {
    const asset1 = { type: "hts", assetReference: "0.0.5022567" };

    expect(await getTokenFromAsset(mockCurrency, asset1)).toMatchObject({
      id: "hedera/hts/hbark_0.0.5022567",
      contractAddress: "0.0.5022567",
      name: "hBARK",
    });
  });

  it("returns undefined for native asset", async () => {
    const nativeAsset = { type: "native" };

    expect(await getTokenFromAsset(mockCurrency, nativeAsset)).toBeUndefined();
  });
});
