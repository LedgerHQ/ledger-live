import { getBlockInfo } from "./getBlockInfo";

const MINTED_BLOCK = 480818084;

// TODO: re-enable once api.kaspa.org stops throttling /blocks-from-bluescore. The upstream
// provider rate-limits this endpoint hard (HTTP 429 even after the read retries), so the live
// check fails the nightly run. The response mapping stays covered by getBlockInfo.msw.test.ts.
describe.skip("getBlockInfo (integration)", () => {
  it("fetches the block at the latest virtual-chain blue score", async () => {
    const result = await getBlockInfo(MINTED_BLOCK);

    expect(result.height).toBe(MINTED_BLOCK);
    expect(typeof result.hash).toBe("string");
    expect(result.hash.length).toBeGreaterThanOrEqual(64);
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBeGreaterThan(0);
  });
});
