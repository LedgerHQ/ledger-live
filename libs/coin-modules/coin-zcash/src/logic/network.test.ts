import { zcashNetworkOf } from "./network";

describe("zcashNetworkOf", () => {
  it.each([
    ["zcash", "mainnet"],
    ["zcash_testnet", "testnet"],
    ["zcash_regtest", "mainnet"],
  ])("maps %s to %s", (currencyId, expected) => {
    expect(zcashNetworkOf(currencyId)).toBe(expected);
  });
});
