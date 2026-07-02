import { getRewards } from "./getRewards";

describe("getRewards", () => {
  it("throws not supported — Celo has no discrete on-chain reward events", () => {
    expect(() => getRewards("0x7777777777777777777777777777777777777777")).toThrow(/not supported/);
  });
});
