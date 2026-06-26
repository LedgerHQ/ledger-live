import { UserSigner } from "@multiversx/sdk-core";
import { UserSecretKey } from "@multiversx/sdk-core/out/wallet/userKeys";
import { randomBytes } from "crypto";
import MultiversXApiClient from "../api/apiCalls";
import { listOperations } from "./listOperations";

const API_ENDPOINT = "https://elrond.coin.ledger.com";
const DELEGATION_API_ENDPOINT = "https://delegations-elrond.coin.ledger.com";
const api = new MultiversXApiClient(API_ENDPOINT, DELEGATION_API_ENDPOINT);

// Address with steady mainnet activity.
const ACTIVE_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const UNUSED_ADDRESS = new UserSigner(new UserSecretKey(randomBytes(32))).getAddress().bech32();

const KNOWN_TYPES = ["IN", "OUT", "FEES", "NONE", "DELEGATE", "UNDELEGATE", "WITHDRAW_UNBONDED"];

jest.setTimeout(60_000);

describe("listOperations (integration)", () => {
  it("fetches well-formed operations for an active account", async () => {
    const { items } = await listOperations(api, ACTIVE_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 5,
    });

    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(5);

    for (const op of items) {
      expect(typeof op.id).toBe("string");
      expect(KNOWN_TYPES).toContain(op.type);
      expect(typeof op.value).toBe("bigint");
      expect(["native", "esdt"]).toContain(op.asset.type);
      expect(Array.isArray(op.senders)).toBe(true);
      expect(Array.isArray(op.recipients)).toBe(true);

      expect(typeof op.tx.hash).toBe("string");
      expect(op.tx.hash.length).toBeGreaterThan(0);
      expect(typeof op.tx.block.height).toBe("number");
      expect(typeof op.tx.fees).toBe("bigint");
      expect(op.tx.date).toBeInstanceOf(Date);
      expect(typeof op.tx.failed).toBe("boolean");
    }
  });

  it("returns a pagination cursor when more results are available", async () => {
    const { items, next } = await listOperations(api, ACTIVE_ADDRESS, {
      minHeight: 0,
      order: "desc",
      limit: 2,
    });

    expect(items.length).toBeGreaterThan(0);
    expect(typeof next).toBe("string");
  });

  it("supports cursor-based pagination without overlap", async () => {
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

    const page1Hashes = new Set(page1.items.map(op => op.tx.hash));
    for (const op of page2.items) {
      expect(page1Hashes.has(op.tx.hash)).toBe(false);
    }
  });

  it("returns an empty list for an unused address", async () => {
    const { items, next } = await listOperations(api, UNUSED_ADDRESS, {
      minHeight: 0,
      order: "desc",
    });

    expect(items).toEqual([]);
    expect(next).toBeUndefined();
  });

  it("throws for an invalid address", async () => {
    await expect(listOperations(api, "not-a-valid-address", { minHeight: 0 })).rejects.toThrow(
      /Invalid MultiversX address/,
    );
  });
});
