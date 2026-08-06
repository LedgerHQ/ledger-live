import {
  COUNTERPARTY_ACCOUNT_HASH,
  COUNTERPARTY_PUBLIC_KEY,
  INCOMING_TX,
  INDEXER_ACCOUNT_HASH,
  INDEXER_PUBLIC_KEY,
  OUTGOING_TX,
  PUBLIC_KEY_TARGET_TX,
  txWith,
} from "../__tests__/fixtures";
import { ITxnHistoryData } from "../types/network";
import { listOperations } from "./listOperations";
import { casperAccountHashFromPublicKey } from "./validateAddress";

jest.mock("../network/api", () => ({
  fetchTxsPage: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fetchTxsPage } = require("../network/api");
const mockFetchTxsPage = fetchTxsPage as jest.Mock;

/** The indexer serves a fixed 10 records per page regardless of any `limit` parameter. */
const PAGE_SIZE = 10;

function serve(records: ITxnHistoryData[]): void {
  mockFetchTxsPage.mockImplementation(async (_address: string, page: number) => ({
    data: records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page_count: Math.ceil(records.length / PAGE_SIZE),
    item_count: records.length,
  }));
}

/** A synthetic outgoing history, newest first, mirroring the indexer's descending order. */
function history(count: number): ITxnHistoryData[] {
  return Array.from({ length: count }, (_, i) =>
    txWith(OUTGOING_TX, {
      deploy_hash: `deploy-${String(i).padStart(4, "0")}`,
      block_height: 1_000_000 - i,
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listOperations", () => {
  describe("mapping", () => {
    it("maps an outgoing transfer with the amount and the real fee kept separate", async () => {
      serve([OUTGOING_TX]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items).toHaveLength(1);
      const [op] = items;
      expect(op.id).toBe(`${OUTGOING_TX.deploy_hash}-OUT`);
      expect(op.type).toBe("OUT");
      expect(op.senders).toEqual([INDEXER_ACCOUNT_HASH]);
      expect(op.recipients).toEqual([OUTGOING_TX.args.target.parsed]);
      // The amount alone — not amount + fee, which the legacy model used.
      expect(op.value).toBe(2_500_000_000n);
      expect(op.asset).toEqual({ type: "native" });
      expect(op.tx.hash).toBe(OUTGOING_TX.deploy_hash);
      // The record's own cost, not the flat 0.1 CSPR estimate.
      expect(op.tx.fees).toBe(BigInt(OUTGOING_TX.cost));
      expect(op.tx.feesPayer).toBe(INDEXER_ACCOUNT_HASH);
      expect(op.tx.failed).toBe(false);
      expect(op.tx.date).toEqual(new Date("2022-11-18T15:38:19Z"));
    });

    it("reports the real block, not a placeholder height", async () => {
      serve([OUTGOING_TX]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].tx.block).toEqual({
        height: 1272937,
        hash: OUTGOING_TX.block_hash,
        time: new Date("2022-11-18T15:38:19Z"),
      });
    });

    it("maps an incoming transfer", async () => {
      serve([INCOMING_TX]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(`${INCOMING_TX.deploy_hash}-IN`);
      expect(items[0].type).toBe("IN");
      expect(items[0].senders).toEqual([COUNTERPARTY_ACCOUNT_HASH]);
      expect(items[0].recipients).toEqual([INDEXER_ACCOUNT_HASH]);
      expect(items[0].value).toBe(12_000_000_000n);
    });

    it("yields both an OUT and an IN for a self-transfer", async () => {
      const selfTransfer = txWith(OUTGOING_TX, {
        args: {
          ...OUTGOING_TX.args,
          target: { cl_type: { ByteArray: 32 }, parsed: INDEXER_ACCOUNT_HASH },
        },
      });
      serve([selfTransfer]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items.map(o => o.type)).toEqual(["OUT", "IN"]);
      expect(items.map(o => o.id)).toEqual([
        `${selfTransfer.deploy_hash}-OUT`,
        `${selfTransfer.deploy_hash}-IN`,
      ]);
    });

    it("hashes a PublicKey target and uses a ByteArray target as-is", async () => {
      // The captured PublicKey-target record is sent by the counterparty, so list it for them.
      serve([PUBLIC_KEY_TARGET_TX]);
      const { items } = await listOperations(COUNTERPARTY_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].recipients).toEqual([
        casperAccountHashFromPublicKey(PUBLIC_KEY_TARGET_TX.args.target.parsed),
      ]);
      // ...and it is a hash, not the public key that was on the wire.
      expect(items[0].recipients[0]).not.toBe(PUBLIC_KEY_TARGET_TX.args.target.parsed);

      serve([OUTGOING_TX]);
      const byteArray = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });
      expect(byteArray.items[0].recipients).toEqual([OUTGOING_TX.args.target.parsed]);
    });

    it("falls back to deriving the sender when caller_hash is absent", async () => {
      serve([txWith(OUTGOING_TX, { caller_hash: "" })]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].senders).toEqual([INDEXER_ACCOUNT_HASH]);
    });

    it("flags a failed operation from error_message", async () => {
      serve([txWith(OUTGOING_TX, { error_message: "User error: 1" })]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].tx.failed).toBe(true);
    });
  });

  describe("transfer id", () => {
    it("omits the transfer id when the indexer reports it as null", async () => {
      serve([OUTGOING_TX]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].details).not.toHaveProperty("transferId");
    });

    it("carries a numeric transfer id through as a string", async () => {
      serve([INCOMING_TX]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].details?.transferId).toBe("7772882");
    });

    it("does not truncate a large transfer id", async () => {
      const largeId = 8342323978502316;
      serve([
        txWith(INCOMING_TX, {
          args: { ...INCOMING_TX.args, id: { cl_type: { Option: "U64" }, parsed: largeId } },
        }),
      ]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].details?.transferId).toBe("8342323978502316");
    });

    it("keeps a zero transfer id rather than dropping it", async () => {
      serve([
        txWith(INCOMING_TX, {
          args: { ...INCOMING_TX.args, id: { cl_type: { Option: "U64" }, parsed: 0 } },
        }),
      ]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items[0].details?.transferId).toBe("0");
    });
  });

  describe("resilience", () => {
    it("skips an unmappable record and still returns the rest", async () => {
      // A record whose target argument never arrived. Built as a fresh args object so the shared
      // fixture is not mutated.
      const { target: _dropped, ...argsWithoutTarget } = OUTGOING_TX.args;
      const malformed = txWith(OUTGOING_TX, {
        deploy_hash: "malformed",
        block_height: 1_000_001,
        args: argsWithoutTarget as ITxnHistoryData["args"],
      });

      serve([
        txWith(OUTGOING_TX, { deploy_hash: "good-1", block_height: 1_000_002 }),
        malformed,
        txWith(OUTGOING_TX, { deploy_hash: "good-2", block_height: 1_000_000 }),
      ]);

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items.map(o => o.tx.hash)).toEqual(["good-1", "good-2"]);
    });

    it("returns an empty page for an account with no history", async () => {
      mockFetchTxsPage.mockResolvedValue({ data: [], page_count: 0, item_count: 0 });

      const result = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(result.items).toEqual([]);
      expect(result.next).toBeUndefined();
    });
  });

  describe("options", () => {
    it("honours minHeight and stops paging once below it", async () => {
      serve(history(25));

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 999_990 });

      expect(items).toHaveLength(11);
      expect(Math.min(...items.map(o => o.tx.block.height))).toBe(999_990);
      // Page 3 holds only records below minHeight, so it is never requested.
      expect(mockFetchTxsPage).toHaveBeenCalledTimes(2);
    });

    it("stops fetching pages once limit is satisfied", async () => {
      serve(history(50));

      const { items, next } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0, limit: 15 });

      // A soft limit — whole pages are consumed, so it rounds up to a page boundary.
      expect(items).toHaveLength(20);
      expect(mockFetchTxsPage).toHaveBeenCalledTimes(2);
      expect(typeof next).toBe("string");
    });

    it("accepts order desc, which is the indexer's native order", async () => {
      serve(history(3));

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0, order: "desc" });

      expect(items.map(o => o.tx.block.height)).toEqual([1_000_000, 999_999, 999_998]);
    });

    it("raises rather than silently ignoring order asc", async () => {
      serve(history(3));

      await expect(
        listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0, order: "asc" }),
      ).rejects.toThrow(/order "asc" is not supported/);
    });
  });

  describe("cursor", () => {
    it("pages through a full history with no duplicates and no gaps", async () => {
      const all = history(50);
      serve(all);

      const seen: string[] = [];
      let cursor: string | undefined;
      let guard = 0;

      do {
        const page = await listOperations(INDEXER_PUBLIC_KEY, {
          minHeight: 0,
          limit: 10,
          ...(cursor !== undefined && { cursor }),
        });
        seen.push(...page.items.map(o => o.tx.hash));
        cursor = page.next;
      } while (cursor !== undefined && ++guard < 20);

      expect(cursor).toBeUndefined();
      expect(seen).toEqual(all.map(t => t.deploy_hash));
      expect(new Set(seen).size).toBe(all.length);
    });

    it("is not volatile — a stale cursor still resumes correctly after new operations arrive", async () => {
      const original = history(30);
      serve(original);

      const first = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0, limit: 10 });
      expect(typeof first.next).toBe("string");

      // Three newer operations land before the caller comes back with its cursor, shifting every
      // page index by three.
      const newer = [
        txWith(OUTGOING_TX, { deploy_hash: "newer-1", block_height: 1_000_003 }),
        txWith(OUTGOING_TX, { deploy_hash: "newer-2", block_height: 1_000_002 }),
        txWith(OUTGOING_TX, { deploy_hash: "newer-3", block_height: 1_000_001 }),
      ];
      serve([...newer, ...original]);

      const second = await listOperations(INDEXER_PUBLIC_KEY, {
        minHeight: 0,
        limit: 10,
        cursor: first.next as string,
      });

      const firstHashes = first.items.map(o => o.tx.hash);
      const secondHashes = second.items.map(o => o.tx.hash);
      // No overlap with what was already delivered, and no record skipped at the seam.
      expect(secondHashes.filter(h => firstHashes.includes(h))).toEqual([]);
      expect(secondHashes[0]).toBe(original[firstHashes.length].deploy_hash);
    });

    it("ignores a malformed cursor instead of throwing", async () => {
      serve(history(3));

      for (const cursor of [
        "not-json",
        "[]",
        "{}",
        '{"blockHeight":"x","deployHash":1}',
        '"str"',
      ]) {
        const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0, cursor });
        expect(items).toHaveLength(3);
      }
    });

    it("resumes from the first strictly older record when the cursor's record is gone", async () => {
      const all = history(20);
      serve(all);

      const cursor = JSON.stringify({
        blockHeight: all[4].block_height,
        deployHash: "a-deploy-that-no-longer-exists",
      });

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0, cursor });

      expect(items[0].tx.hash).toBe(all[5].deploy_hash);
    });

    it("restarts from page 1 when the cursor's page hint has drifted", async () => {
      const all = history(30);
      serve(all);

      // A hint pointing past the boundary: the boundary sits on page 1 but the hint says page 3.
      const cursor = JSON.stringify({
        blockHeight: all[2].block_height,
        deployHash: all[2].deploy_hash,
        page: 3,
      });

      const { items } = await listOperations(INDEXER_PUBLIC_KEY, { minHeight: 0, cursor });

      // Correctness wins over the hint: nothing between the boundary and page 3 is lost.
      expect(items[0].tx.hash).toBe(all[3].deploy_hash);
      expect(mockFetchTxsPage).toHaveBeenCalledWith(INDEXER_PUBLIC_KEY, 1);
    });
  });
});
