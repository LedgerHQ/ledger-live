import { getSwapCurrencyIds } from "../getSwapCurrencyIds";

describe("getSwapCurrencyIds", () => {
  const noneDeactivated = new Set<string>();

  it("keeps only the networks swap supports", () => {
    expect(
      getSwapCurrencyIds(["ethereum", "base", "solana"], ["ethereum", "base"], noneDeactivated),
    ).toEqual(["ethereum", "base"]);
  });

  it("drops native currencies whose network is deactivated", () => {
    expect(
      getSwapCurrencyIds(["ethereum", "base"], ["ethereum", "base"], new Set(["base"])),
    ).toEqual(["ethereum"]);
  });

  it("drops tokens whose parent network is deactivated", () => {
    const usdc = ["ethereum/erc20/usd__coin", "arbitrum/erc20/usd_coin"];

    expect(getSwapCurrencyIds(usdc, usdc, new Set(["arbitrum"]))).toEqual([
      "ethereum/erc20/usd__coin",
    ]);
  });

  it("returns undefined while the market asset is not loaded", () => {
    expect(getSwapCurrencyIds(undefined, ["ethereum"], noneDeactivated)).toBeUndefined();
  });
});
