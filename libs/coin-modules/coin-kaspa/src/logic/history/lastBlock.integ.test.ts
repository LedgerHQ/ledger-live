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
    const [result, dag] = await Promise.all([lastBlock(), getBlockDagInfo()]);

    // The API still exposes the tip; that lastBlock returns exactly that field is covered by the
    // unit and MSW tests. Not compared to this response's sink: at ~10 blocks/s it moves between calls.
    expect(dag.sink).toMatch(/^[0-9a-f]{64}$/);
    expect(result.hash).toMatch(/^[0-9a-f]{64}$/);
    // The pruning point only moves every few hours, so it never equals the current tip.
    expect(result.hash).not.toBe(dag.pruningPointHash);
  });
});
