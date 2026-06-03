import { TEST_ADDRESSES } from "../test/fixtures";
import { lastBlock } from "./lastBlock";
import { listOperations } from "./listOperations";

describe("listOperations (integration)", () => {
  let recentHeight: number;

  beforeAll(async () => {
    // Use a recent block height to avoid full-chain scans that timeout the API
    const block = await lastBlock();
    recentHeight = Math.max(0, block.height - 10_000);
  });

  it("returns Page<Operation> with items array and optional next cursor", async () => {
    const result = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: recentHeight,
      limit: 5,
    });

    expect(Array.isArray(result.items)).toBe(true);
    // next is either a string cursor or undefined
    expect(result.next === undefined || typeof result.next === "string").toBe(true);
  });

  it("operations have required fields", async () => {
    // Fetch from genesis height to guarantee history for this known address
    const result = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      limit: 1,
    });

    expect(result.items.length).toBeGreaterThan(0);

    const op = result.items[0];
    expect(typeof op.id).toBe("string");
    expect(op.id.length).toBeGreaterThan(0);
    expect(["IN", "OUT", "FEES"]).toContain(op.type);
    expect(typeof op.value).toBe("bigint");
    expect(Array.isArray(op.senders)).toBe(true);
    expect(Array.isArray(op.recipients)).toBe(true);
    expect(op.asset).toBeDefined();
    expect(op.tx).toBeDefined();
    expect(typeof op.tx.hash).toBe("string");
    expect(typeof op.tx.block.height).toBe("number");
    expect(op.tx.date).toBeInstanceOf(Date);
    expect(typeof op.tx.fees).toBe("bigint");
    expect(typeof op.tx.failed).toBe("boolean");
  });
});
