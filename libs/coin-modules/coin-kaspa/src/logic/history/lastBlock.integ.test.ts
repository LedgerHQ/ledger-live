import { getBlockDagInfo } from "../../network";
import { lastBlock } from "./lastBlock";

describe("lastBlock (integration)", () => {
  it("fetches the current confirmed block from the Kaspa API", async () => {
    const result = await lastBlock();

    expect(result.height).toBeGreaterThan(0);
    expect(typeof result.hash).toBe("string");
    expect(result.hash.length).toBeGreaterThanOrEqual(64);
    expect(result.time).toBeInstanceOf(Date);
  });

  it("returns the chain tip, not the pruning point", async () => {
    const [result, { pruningPointHash }] = await Promise.all([lastBlock(), getBlockDagInfo()]);

    // The pruning point only moves every few hours, so it never equals the current tip.
    expect(result.hash).not.toBe(pruningPointHash);
  });
});
