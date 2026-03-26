import { Keypair } from "@solana/web3.js";
import { getChainAPI } from "../../network";
import { listOperations } from "../listOperations";

const api = getChainAPI({ endpoint: "https://solana.coin.ledger.com" });

const ACTIVE_ADDRESS = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const UNUSED_ADDRESS = Keypair.generate().publicKey.toBase58();

describe("listOperations (integration)", () => {
  it("fetches operations for an active account", async () => {
    const result = await listOperations(api, ACTIVE_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 5,
    });

    expect(result.items.length).toBeGreaterThan(0);

    for (const op of result.items) {
      expect(op.tx.hash.length).toBeGreaterThan(0);
      expect(op.tx.block.height).toBeGreaterThan(0);
      expect(op.tx.block.time).toBeInstanceOf(Date);
      expect(typeof op.value).toBe("bigint");
      expect(["IN", "OUT", "FEES", "NONE"]).toContain(op.type);
    }
  });

  it("returns pagination cursor when more results are available", async () => {
    const result = await listOperations(api, ACTIVE_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 2,
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(typeof result.next).toBe("string");
  });

  it("returns empty list for an unused address", async () => {
    const result = await listOperations(api, UNUSED_ADDRESS, {
      minHeight: 0,
      order: "desc",
    });

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("supports cursor-based pagination", async () => {
    const page1 = await listOperations(api, ACTIVE_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 2,
    });

    expect(typeof page1.next).toBe("string");

    const page2 = await listOperations(api, ACTIVE_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 2,
      cursor: page1.next ?? "",
    });

    expect(page2.items.length).toBeGreaterThan(0);
    const page1Hashes = new Set(page1.items.map(op => op.tx.hash));
    for (const op of page2.items) {
      expect(page1Hashes.has(op.tx.hash)).toBe(false);
    }
  });
});
