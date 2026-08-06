import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { getCoinConfig } from "../config";
import { listOperations } from "./listOperations";

/** A funded mainnet account with a small, stable transfer history. */
const FUNDED_PUBLIC_KEY = "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";
/** Well-formed ed25519 key that has never been funded. */
const UNFUNDED_PUBLIC_KEY = "01a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

jest.mock("../config");

describe("Casper listOperations", () => {
  jest.mocked(getCoinConfig).mockReturnValue({
    ...({} as unknown as CurrencyConfig),
    infra: {
      API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
      API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
    },
  });

  it("returns plausible native operations for a funded account", async () => {
    const { items } = await listOperations(FUNDED_PUBLIC_KEY, { minHeight: 0 });

    expect(items.length).toBeGreaterThan(0);

    for (const op of items) {
      expect(["OUT", "IN"]).toContain(op.type);
      expect(op.asset).toEqual({ type: "native" });
      expect(op.tx.block.height).toBeGreaterThan(0);
      expect(op.tx.block.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(op.tx.fees).toBeGreaterThan(0n);
      expect(op.value).toBeGreaterThanOrEqual(0n);
      expect(op.senders.length).toBeGreaterThan(0);
      expect(op.recipients.length).toBeGreaterThan(0);
      expect(Number.isNaN(op.tx.date.getTime())).toBe(false);
    }
  });

  it("returns operations newest first with unique ids", async () => {
    const { items } = await listOperations(FUNDED_PUBLIC_KEY, { minHeight: 0, order: "desc" });

    const heights = items.map(op => op.tx.block.height);
    expect([...heights].sort((a, b) => b - a)).toEqual(heights);

    const ids = items.map(op => op.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("honours minHeight", async () => {
    const { items: all } = await listOperations(FUNDED_PUBLIC_KEY, { minHeight: 0 });
    const cutoff = all[all.length - 1].tx.block.height + 1;

    const { items } = await listOperations(FUNDED_PUBLIC_KEY, { minHeight: cutoff });

    expect(items.length).toBeLessThan(all.length);
    for (const op of items) {
      expect(op.tx.block.height).toBeGreaterThanOrEqual(cutoff);
    }
  });

  it("returns an empty page for a never-funded account", async () => {
    const result = await listOperations(UNFUNDED_PUBLIC_KEY, { minHeight: 0 });

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("rejects an unsupported order", async () => {
    await expect(listOperations(FUNDED_PUBLIC_KEY, { minHeight: 0, order: "asc" })).rejects.toThrow(
      /not supported/,
    );
  });
});
