import { getBlockInfo } from "../getBlockInfo";
import type { BitcoinContext } from "../../api/config";

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

// A well-known mainnet block with a stable hash.
const HEIGHT = 800_000;
const HASH = "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054";

describe("logic/getBlockInfo (integration)", () => {
  it("returns the metadata of a known block", async () => {
    const info = await getBlockInfo(context, "bitcoin", HEIGHT);
    expect(info.height).toBe(HEIGHT);
    expect(info.hash).toBe(HASH);
    expect(info.time).toBeInstanceOf(Date);
    expect(info.time.getTime()).toBeGreaterThan(0);
  });
});
