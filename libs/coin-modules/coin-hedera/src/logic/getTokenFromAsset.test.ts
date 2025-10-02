import { getTokenFromAsset } from "./getTokenFromAsset";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";

describe("getTokenFromAsset", () => {
  const mockCurrency = getMockedCurrency();

  it("returns token from USDC asset", async () => {
    const asset1 = { type: "hts", assetReference: "0.0.5022567" };
    const asset2 = { type: "hts", assetReference: "0.0.456858" };

    expect(await getTokenFromAsset(mockCurrency, asset1)).toMatchObject({
      id: "hedera/hts/hbark_0.0.5022567",
      contractAddress: "0.0.5022567",
      name: "hBARK",
    });
    expect(await getTokenFromAsset(mockCurrency, asset2)).toMatchObject({
      id: "hedera/hts/usd_coin_0.0.456858",
      contractAddress: "0.0.456858",
      name: "USD Coin",
    });
  });
});
