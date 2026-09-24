import { fetchLatestBlock } from "../../network/blocks";
import { lastBlock } from "../lastBlock";
import { mainnetStacksConfig } from "../../test/context";

describe("lastBlock (Alpaca)", () => {
  it("returns the real chain tip's previous block, not the tip itself", async () => {
    // Bounded rather than exact-matched against a single tip snapshot: Stacks produces a block
    // every ~5s, so a new block can land between the two real network calls below.
    const tipBefore = await fetchLatestBlock(mainnetStacksConfig);
    const result = await lastBlock(mainnetStacksConfig);
    const tipAfter = await fetchLatestBlock(mainnetStacksConfig);

    expect(result.height).toBeGreaterThanOrEqual(tipBefore.height - 1);
    expect(result.height).toBeLessThan(tipAfter.height);
    expect(result.time.getTime()).toBeGreaterThan(0);
  });
});
