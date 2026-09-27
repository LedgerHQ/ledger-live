import { publicKeyToAddress } from "../kaspaAddresses";
import { listOperations } from "./listOperations";

// See getBalance.integ.test.ts: a freshly-derived address has no on-chain history.
const PRISTINE_ADDRESS = publicKeyToAddress(Buffer.alloc(32, 0xdd));
// Dedicated, independently-funded Kaspa account (see getBalance.integ.test.ts). The funding
// transaction itself gives it on-chain history, so it has ≥ 1 operation.
const ACTIVE_ADDRESS = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";
// ACTIVE_ADDRESS's full history (all confirmed on 2026-07-08, newest first). Past txs are immutable
// and nothing in this suite broadcasts from the address, so these stay exact. Each tx has its own
// block time, so the indexer never widens a page past `limit` (it adds same-time txs at page edges).
const HISTORY = [
  { id: "443c147876c7f329e2f182b8143cd6687633a5b520480f166edb5c653112c252", score: 479_353_545 },
  { id: "42382f0eccd12c356f3ab515a770b21f40162ba389d5cbba72bf21712f936c19", score: 479_353_058 },
  { id: "c2d2a66c07ef8a02e330ea89ae62e9ced60e7469cb50511341f45e2c4f833ab3", score: 479_351_811 },
  { id: "d30a1f46868890dab3f7ca9464bbcf2d5731535546523b7caf5b5b82f586dcfb", score: 479_117_398 },
];
const [NEWEST, SECOND, THIRD, OLDEST] = HISTORY;
const ids = (...txs: typeof HISTORY) => txs.map(tx => tx.id);

type ListedPage = Awaited<ReturnType<typeof listOperations>>;

// Follows `next` until listOperations says stop, the way any caller pages through it.
async function listAllPages(
  address: string,
  minHeight: number,
  limit?: number,
): Promise<ListedPage[]> {
  const pages: ListedPage[] = [];
  let cursor: string | undefined;
  do {
    const page = await listOperations(address, {
      minHeight,
      order: "desc",
      ...(limit !== undefined ? { limit } : {}),
      ...(cursor ? { cursor } : {}),
    });
    pages.push(page);
    cursor = page.next;
  } while (cursor);
  return pages;
}

describe("listOperations (integration)", () => {
  it("returns an empty page for a pristine address", async () => {
    const page = await listOperations(PRISTINE_ADDRESS, { minHeight: 0 });

    expect(page.items).toEqual([]);
  });

  describe("standard address with history", () => {
    it("returns at least one operation with IN/OUT metadata (api.mdx)", async () => {
      const page = await listOperations(ACTIVE_ADDRESS, { minHeight: 0 });

      expect(page.items.length).toBeGreaterThan(0);
      for (const op of page.items) {
        expect(["IN", "OUT"]).toContain(op.type);
        expect(typeof op.value).toBe("bigint");
        expect(op.tx.hash).toEqual(expect.any(String));
        expect(op.asset).toEqual({ type: "native", name: "KAS" });
      }
    });
  });

  describe("page walk (ACTIVE_ADDRESS, small pages)", () => {
    it.each([
      {
        name: "full sync, 1 tx per page, walks all 4 pages newest first",
        minHeight: 0,
        limit: 1,
        pages: [ids(NEWEST), ids(SECOND), ids(THIRD), ids(OLDEST)],
      },
      {
        name: "full sync, 2 txs per page",
        minHeight: 0,
        limit: 2,
        pages: [ids(NEWEST, SECOND), ids(THIRD, OLDEST)],
      },
      {
        name: "full sync, default page size, one page",
        minHeight: 0,
        limit: undefined,
        pages: [ids(NEWEST, SECOND, THIRD, OLDEST)],
      },
      {
        // synced up to THIRD: pages 1–2 are new, page 3 holds only THIRD → dropped → stop
        name: "incremental, 1 tx per page, stops on the first already-synced page",
        minHeight: THIRD.score + 1,
        limit: 1,
        pages: [ids(NEWEST), ids(SECOND), []],
      },
      {
        name: "incremental, 2 txs per page, stops on the page after the new ones",
        minHeight: THIRD.score + 1,
        limit: 2,
        pages: [ids(NEWEST, SECOND), []],
      },
      {
        // synced up to SECOND: page 1 already reaches known history → stop without a 2nd call
        name: "incremental, known history on the first page, single call",
        minHeight: SECOND.score + 1,
        limit: 2,
        pages: [ids(NEWEST)],
      },
      {
        name: "incremental, nothing new since the last sync",
        minHeight: NEWEST.score + 1,
        limit: 1,
        pages: [[]],
      },
    ])("$name", async ({ minHeight, limit, pages: expectedPages }) => {
      const pages = await listAllPages(ACTIVE_ADDRESS, minHeight, limit);

      expect(pages.map(page => page.items.map(op => op.id))).toEqual(expectedPages);
      expect(pages.at(-1)?.next).toBeUndefined();
      for (const page of pages) {
        for (const op of page.items) {
          expect(op.tx.block.height).toBeGreaterThanOrEqual(minHeight);
        }
        // generic-coin-framework's paginateOperations treats "empty page + cursor" as a broken module.
        expect(page.items.length === 0 && page.next !== undefined).toBe(false);
      }
    });
  });
});
