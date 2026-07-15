import { getRewards } from "./getRewards";

describe("getRewards", () => {
  it("rejects with not supported — Celo has no discrete on-chain reward events", async () => {
    await expect(getRewards("0x7777777777777777777777777777777777777777")).rejects.toThrow(
      /not supported/,
    );
  });
});
