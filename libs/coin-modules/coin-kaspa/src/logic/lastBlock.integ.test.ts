import { lastBlock } from "./lastBlock";

describe("lastBlock (integration)", () => {
  it("fetches the current confirmed block from the Kaspa API", async () => {
    const result = await lastBlock();

    expect(result.height).toBeGreaterThan(0);
    expect(typeof result.hash).toBe("string");
    expect(result.hash.length).toBeGreaterThanOrEqual(64);
    expect(result.time).toBeInstanceOf(Date);
  });
});
