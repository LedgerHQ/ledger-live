import { toPayDebitOrderProperties } from "../toPayDebitOrderProperties";

describe("toPayDebitOrderProperties", () => {
  it("maps and normalizes the first five assets", () => {
    expect(toPayDebitOrderProperties(["usdc", "USDT", "dai", "eurc", "pyusd", "ignored"])).toEqual({
      asset1: "USDC",
      asset2: "USDT",
      asset3: "DAI",
      asset4: "EURC",
      asset5: "PYUSD",
    });
  });

  it("maps missing assets to null", () => {
    expect(toPayDebitOrderProperties(["usdc", undefined, null])).toEqual({
      asset1: "USDC",
      asset2: null,
      asset3: null,
      asset4: null,
      asset5: null,
    });
  });
});
