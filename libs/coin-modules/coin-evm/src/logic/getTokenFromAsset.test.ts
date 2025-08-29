import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getTokenFromAsset } from "./getTokenFromAsset";

describe("getTokenFromAsset", () => {
  it("computes the token of the USDC asset", () => {
    expect(
      getTokenFromAsset({ id: "ethereum" } as CryptoCurrency, {
        type: "erc20",
        assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      }),
    ).toMatchObject({
      id: "ethereum/erc20/usd__coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
    });
    expect(
      getTokenFromAsset({ id: "sonic" } as CryptoCurrency, {
        type: "erc20",
        assetReference: "0x29219dd400f2bf60e5a23d13be72b486d4038894",
      }),
    ).toMatchObject({
      id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
      contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
      name: "Bridged USDC (Sonic Labs)",
    });
  });
});
