import { bitcoinDefaults, type BitcoinContext } from "../../config";
import { lastBlock } from "../lastBlock";

const liveContext: BitcoinContext = {
  config: async () => bitcoinDefaults.bitcoin,
  logger: () => {},
};

describe("lastBlock (live explorer)", () => {
  it("returns the tip with a positive height, a 64-hex hash and a valid date", async () => {
    const info = await lastBlock(liveContext, "bitcoin");
    expect(info.height).toBeGreaterThan(0);
    expect(info.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(info.time).toBeInstanceOf(Date);
    expect(Number.isNaN(info.time.getTime())).toBe(false);
  });
});
