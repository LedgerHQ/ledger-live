import { cantonDefaults } from "../config";
import { getLedgerEnd } from "../network/gateway";
import { createMockContext } from "../test/fixtures";
import { createApi } from ".";

describe("lastBlock (devnet)", () => {
  it("returns the ledger end as the block height", async () => {
    const config = cantonDefaults.canton_network_devnet;
    const before = await getLedgerEnd(config);
    const block = await createApi().lastBlock(createMockContext(config));
    const after = await getLedgerEnd(config);

    expect(block.height).toBeGreaterThanOrEqual(before);
    expect(block.height).toBeLessThanOrEqual(after);
    expect(block.hash).toBe("");
    expect(Number.isFinite(block.time.getTime())).toBe(true);
  });
});
