import { isRobinhoodExclusiveAsset } from "../isRobinhoodExclusiveAsset";

describe("isRobinhoodExclusiveAsset", () => {
  it("returns true for a token only on robinhood_testnet", () => {
    expect(
      isRobinhoodExclusiveAsset([
        "robinhood_testnet/erc20/amd_0x71178bac73cbeb415514eb542a8995b82669778d",
      ]),
    ).toBe(true);
  });

  it("returns true for a token only on robinhood mainnet", () => {
    expect(isRobinhoodExclusiveAsset(["robinhood/erc20/amd_0xabc"])).toBe(true);
  });

  it("returns true when every network is a Robinhood chain", () => {
    expect(
      isRobinhoodExclusiveAsset(["robinhood/erc20/amd_0xabc", "robinhood_testnet/erc20/amd_0xdef"]),
    ).toBe(true);
  });

  it("returns false for a multi-network asset that also lives on Robinhood (e.g. WETH)", () => {
    expect(
      isRobinhoodExclusiveAsset([
        "ethereum/erc20/weth_0x0bd7d308f8e1639fab988df18a8011f41eacad73",
        "robinhood/erc20/weth_0x0bd7d308f8e1639fab988df18a8011f41eacad73",
      ]),
    ).toBe(false);
  });

  it("returns false for an asset on another chain only", () => {
    expect(isRobinhoodExclusiveAsset(["ethereum"])).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(isRobinhoodExclusiveAsset([])).toBe(false);
  });
});
