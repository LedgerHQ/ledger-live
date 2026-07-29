import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getChainAPI } from "../../network";
import { listOperations } from "../listOperations";

const api = getChainAPI({ endpoint: "https://solana.coin.ledger.com" });

const ACTIVE_ADDRESS = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const UNUSED_ADDRESS = Keypair.generate().publicKey.toBase58();

const LIVE_35047_WALLET = "4to9dpNnBqvAbgKd17vjeMXiQVbXi2ewn6QbtT3opF8N";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const LIVE_35047_USDC_ATA = getAssociatedTokenAddressSync(
  new PublicKey(USDC_MINT),
  new PublicKey(LIVE_35047_WALLET),
).toBase58();

const KNOWN_TYPES = ["IN", "OUT", "FEES", "NONE", "DELEGATE", "UNDELEGATE", "WITHDRAW_UNBONDED"];

// Per-type coverage (all 7 types) is in listOperations.test.ts (MSW) and
// listOperations.unit.test.ts. This file focuses on real-RPC smoke tests.
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
      expect(KNOWN_TYPES).toContain(op.type);
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

  // Regression for LIVE-35047: a SOL -> USDC Jupiter swap's USDC leg was
  // invisible because token balances were matched by wallet `owner` only, while
  // coin-service queries token sub-accounts by their token-account (ATA)
  // address. Querying by the ATA must surface the token ops, resolved to the
  // wallet owner (not the queried ATA).
  it("surfaces token operations when queried by the token-account (ATA) address (LIVE-35047)", async () => {
    const result = await listOperations(api, LIVE_35047_USDC_ATA, {
      minHeight: 0,
      order: "desc",
      limit: 100,
    });

    const tokenOps = result.items.filter(op => op.asset.type !== "native");

    expect(tokenOps.length).toBeGreaterThan(0);
    for (const op of tokenOps) {
      // Resolves to the wallet owner regardless of the queried ATA.
      expect(op.asset).toMatchObject({
        assetReference: USDC_MINT,
        assetOwner: LIVE_35047_WALLET,
      });
      expect(op.type === "IN" ? op.recipients : op.senders).toContain(LIVE_35047_WALLET);
    }
  });
});
