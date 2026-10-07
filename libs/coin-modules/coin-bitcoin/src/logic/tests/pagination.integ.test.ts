import { createApi } from "../../api";
import type { BitcoinContext } from "../../config";

const context = (explorerId: string): BitcoinContext => ({
  config: async () => ({
    status: { type: "active" },
    name: explorerId,
    unit: { name: explorerId, code: explorerId.toUpperCase(), magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId,
  }),
  logger: () => {},
});

const hashes = (page: { items: { tx: { hash: string } }[] }) => page.items.map(op => op.tx.hash);

// A Komodo address with a long, busy history (hundreds of transactions).
const BUSY_ADDRESS = "RNjJYvz6aCMaeZanXfCpXvoc2FKxEKMTj2";

/**
 * listOperations reads one page per call: the second page comes from the first page's cursor, and
 * the two together are the first page of twice the size. No call reads the whole history.
 */
describe("listOperations pagination (live explorer)", () => {
  const api = createApi("komodo");
  const ctx = context("kmd");

  it.each(["desc", "asc"] as const)("pages %s through the history by cursor", async order => {
    const first = await api.listOperations(ctx, BUSY_ADDRESS, { minHeight: 0, order, limit: 3 });
    expect(first.next).toEqual(expect.any(String));
    const second = await api.listOperations(ctx, BUSY_ADDRESS, {
      minHeight: 0,
      order,
      limit: 3,
      cursor: first.next!,
    });
    const both = await api.listOperations(ctx, BUSY_ADDRESS, { minHeight: 0, order, limit: 6 });

    expect([...hashes(first), ...hashes(second)]).toEqual(hashes(both));
    expect(new Set([...hashes(first), ...hashes(second)]).size).toBe(6);
  });

  it("keeps the minimum height on later pages", async () => {
    const tip = await api.lastBlock(ctx);
    const minHeight = tip.height - 2_000;
    const first = await api.listOperations(ctx, BUSY_ADDRESS, { minHeight, limit: 3 });
    const second = await api.listOperations(ctx, BUSY_ADDRESS, {
      minHeight,
      limit: 3,
      cursor: first.next!,
    });
    for (const op of [...first.items, ...second.items]) {
      expect(op.tx.block.height).toBeGreaterThanOrEqual(minHeight);
    }
  });
});

describe("Bitcoin Cash with a prefixless cashaddr address (live explorer)", () => {
  // As Ledger Wallet stores it: the explorer itself answers 500 for this form.
  const PREFIXLESS = "qzf9ax7we6swngffah3e9gr4mgh0qw3zcy6kq5afau";
  const api = createApi("bitcoin_cash");
  const ctx = context("bch");

  it("reads the same balance and history as the prefixed form", async () => {
    const [prefixless] = await api.getBalance(ctx, PREFIXLESS);
    const [prefixed] = await api.getBalance(ctx, `bitcoincash:${PREFIXLESS}`);
    expect(prefixless.value).toBe(prefixed.value);

    const history = await api.listOperations(ctx, PREFIXLESS, { minHeight: 0, limit: 5 });
    expect(history.items.length).toBeGreaterThan(0);
    expect(history.items.map(op => op.tx.hash)).toEqual(
      (
        await api.listOperations(ctx, `bitcoincash:${PREFIXLESS}`, { minHeight: 0, limit: 5 })
      ).items.map(op => op.tx.hash),
    );
  });
});
