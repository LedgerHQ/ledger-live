import { getBlock } from "../getBlock";
import type { BitcoinContext } from "../../api/config";

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

// A well-known mainnet block with a stable hash.
const HEIGHT = 800_000;
const HASH = "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054";

describe("logic/getBlock (integration)", () => {
  it("returns the block with transactions mapped to transfer operations", async () => {
    const block = await getBlock(context, "bitcoin", HEIGHT);

    expect(block.info.height).toBe(HEIGHT);
    expect(block.info.hash).toBe(HASH);
    expect(block.transactions.length).toBeGreaterThan(0);

    block.transactions.forEach(tx => {
      expect(typeof tx.hash).toBe("string");
      expect(tx.hash.length).toBeGreaterThan(0);
      expect(typeof tx.fees).toBe("bigint");
      expect(tx.failed).toBe(false);
      expect(Array.isArray(tx.operations)).toBe(true);
    });

    // The block must contain at least one positive (incoming) transfer.
    const hasIncoming = block.transactions.some(tx =>
      tx.operations.some(op => op.type === "transfer" && op.amount > 0n),
    );
    expect(hasIncoming).toBe(true);

    // The coinbase (first tx) has no input transfer — its inputs carry no address.
    const coinbase = block.transactions[0];
    expect(coinbase.operations.every(op => op.type === "transfer" && op.amount > 0n)).toBe(true);
  }, 60_000);
});
