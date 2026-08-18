import { listOperations } from "../listOperations";

// A real mainnet address with a modest amount of real transaction history (~20 txs) -- light
// enough to stay well under the test timeout, unlike a high-activity address (a real pool/vault
// address hit during development had 5000+ txs and timed out fetching the full history).
const ACTIVE_ADDRESS = "SP3H6RCZ1X6V85NZBDVCBPGQ1CGBJKY9WYHBKFYBA";

describe("listOperations (Alpaca)", () => {
  it("returns real, correctly-shaped operations for an active address", async () => {
    const { items } = await listOperations(ACTIVE_ADDRESS, { minHeight: 0, order: "desc" });

    expect(items.length).toBeGreaterThan(0);
    for (const op of items) {
      expect(typeof op.id).toBe("string");
      expect(typeof op.type).toBe("string");
      expect(Array.isArray(op.senders)).toBe(true);
      expect(Array.isArray(op.recipients)).toBe(true);
      expect(typeof op.value).toBe("bigint");
      expect(op.tx.hash.length).toBeGreaterThan(0);
      expect(op.tx.block.height).toBeGreaterThan(0);
      expect(op.tx.date).toBeInstanceOf(Date);
      expect(typeof op.tx.failed).toBe("boolean");
    }
  });

  it("orders results ascending when requested", async () => {
    const { items } = await listOperations(ACTIVE_ADDRESS, { minHeight: 0, order: "asc" });

    expect(items.length).toBeGreaterThan(0);
    for (let i = 1; i < items.length; i++) {
      expect(items[i].tx.date.getTime()).toBeGreaterThanOrEqual(items[i - 1].tx.date.getTime());
    }
  });
});
