import { lastBlock } from "./lastBlock";

describe("lastBlock (integration)", () => {
  it("returns a BlockInfo with height > 0, non-empty hash, and Date time", async () => {
    const result = await lastBlock();

    expect(result.height).toBeGreaterThan(0);
    // Filecoin API returns block hashes as hex-encoded CIDs (76 chars observed)
    expect(result.hash).toMatch(/^[0-9a-f]+$/);
    expect(result.hash.length).toBeGreaterThanOrEqual(64);
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBeGreaterThan(0);
  });
});
