import { lastBlock } from "./lastBlock";

describe("lastBlock (integration)", () => {
  it("returns a BlockInfo with height > 0, non-empty hash, and Date time", async () => {
    const result = await lastBlock();

    expect(result.height).toBeGreaterThan(0);
    expect(typeof result.hash).toBe("string");
    expect(result.hash.length).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBeGreaterThan(0);
  });
});
