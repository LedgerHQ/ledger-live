import { getBlockInfo } from "./getBlockInfo";

const MINTED_BLOCK = 480818084;

describe("getBlockInfo (integration)", () => {
  it("fetches the block at the latest virtual-chain blue score", async () => {
    const result = await getBlockInfo(MINTED_BLOCK);

    expect(result.height).toBe(MINTED_BLOCK);
    expect(typeof result.hash).toBe("string");
    expect(result.hash.length).toBeGreaterThanOrEqual(64);
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBeGreaterThan(0);
  });
});
