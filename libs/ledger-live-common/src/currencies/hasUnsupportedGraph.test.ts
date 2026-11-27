import { hasUnsupportedGraph } from "./hasUnsupportedGraph";

describe("hasUnsupportedGraph", () => {
  it("returns true for the VTHO token", () => {
    expect(hasUnsupportedGraph("vechain/vip180/vtho")).toEqual(true);
  });

  it("returns false for any other token", () => {
    expect(hasUnsupportedGraph("ethereum/erc20/usd_tether__erc20_")).toEqual(false);
  });
});
