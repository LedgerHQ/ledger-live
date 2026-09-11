import { lastBlock } from "../lastBlock";
import type { BitcoinContext } from "../../api/config";

// Minimal context — the endpoint is resolved from the currency (getEnv), not the config.
const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

describe("logic/lastBlock (integration)", () => {
  it("fetches the current bitcoin block from the explorer", async () => {
    const block = await lastBlock(context, "bitcoin");

    expect(block.height).toBeGreaterThan(0);
    expect(block.hash.length).toBeGreaterThan(0);
    expect(block.time instanceof Date).toBe(true);
  });
});
