import { createFixtureConfig } from "../../test/fixtures";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";
import { lastBlock } from "./lastBlock";

const CURRENCY = "concordium_testnet";
const config = createFixtureConfig();

describe("getBlock", () => {
  it("returns block info matching getBlockInfo and a well-formed transactions array", async () => {
    // A recent finalized block, backed off from the tip to avoid the not-yet-finalized head.
    const tip = await lastBlock(config, CURRENCY);
    const height = tip.height - 10;

    const [block, info] = await Promise.all([
      getBlock(config, height, CURRENCY),
      getBlockInfo(config, height, CURRENCY),
    ]);

    expect(block.info).toEqual(info);
    expect(Array.isArray(block.transactions)).toBe(true);

    for (const tx of block.transactions) {
      expect(tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(typeof tx.failed).toBe("boolean");
      expect(tx.fees >= BigInt(0)).toBe(true);
      for (const op of tx.operations) {
        expect(["transfer", "other"]).toContain(op.type);
      }
    }
  });
});
