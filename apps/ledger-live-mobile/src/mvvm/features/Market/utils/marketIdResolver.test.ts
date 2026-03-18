import { resolveMarketId, tokenToMarketIdMap } from "./marketIdResolver";

describe("resolveMarketId", () => {
  it("should resolve known ERC20 USDT token to tether", () => {
    expect(resolveMarketId("ethereum/erc20/usd_tether__erc20_")).toBe("tether");
  });

  it("should resolve known ERC20 USDC token to usd-coin", () => {
    expect(resolveMarketId("ethereum/erc20/usd__coin")).toBe("usd-coin");
  });

  it("should return the original id for unknown tokens", () => {
    expect(resolveMarketId("bitcoin")).toBe("bitcoin");
  });

  it("should return the original id for unmapped token paths", () => {
    expect(resolveMarketId("ethereum/erc20/some_unknown_token")).toBe(
      "ethereum/erc20/some_unknown_token",
    );
  });
});

describe("tokenToMarketIdMap", () => {
  it("should contain the expected entries", () => {
    expect(tokenToMarketIdMap).toEqual({
      "ethereum/erc20/usd_tether__erc20_": "tether",
      "ethereum/erc20/usd__coin": "usd-coin",
    });
  });
});
