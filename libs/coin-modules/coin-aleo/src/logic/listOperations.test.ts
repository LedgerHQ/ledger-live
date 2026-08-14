import { getMockedRecord, getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  fetchAllOwnedRecords,
  fetchRecordScannerStatus,
  fetchTransitionPage,
} from "../network/utils";
import type { AleoPublicTransaction } from "../types";
import { lastBlock } from "./lastBlock";
import { listOperations } from "./listOperations";
import { enrichPrivateRecords } from "./listPrivateOperations";

jest.mock("../network/utils");
jest.mock("./lastBlock");
jest.mock("./listPrivateOperations");

const mockLastBlock = jest.mocked(lastBlock);
const mockScannerStatus = jest.mocked(fetchRecordScannerStatus);
const mockOwnedRecords = jest.mocked(fetchAllOwnedRecords);
const mockFetchPage = jest.mocked(fetchTransitionPage);
const mockEnrich = jest.mocked(enrichPrivateRecords);

const config = getMockedConfig("mainnet");
const address = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";
const provableId = "uuid-1";
const viewKey = "AViewKey1secret";

const publicTx = (transactionId: string, blockNumber: number) =>
  getMockedTransaction({
    transaction_id: transactionId,
    transition_id: `au1${transactionId}`,
    block_number: blockNumber,
    sender_address: address,
    recipient_address: "aleo1receiver",
  });

const list = (
  options: Parameters<typeof listOperations>[0]["options"],
  context: { provableId?: string; viewKey?: string } = { provableId, viewKey },
) => listOperations({ config, address, options, ...context });

/** Minimal stand-in for a decrypted record, enough for the mapper to build an operation. */
const enriched = (rawRecord: ReturnType<typeof getMockedRecord>) =>
  ({
    rawRecord,
    details: { fee_value: 0, block_hash: "ab1", status: "Accepted" },
    sender: "aleo1other",
    recipient: address,
    value: { toFixed: () => "1" },
  }) as unknown as NonNullable<Awaited<ReturnType<typeof enrichPrivateRecords>>[number]>;

/**
 * Stands in for the real pager: rows in order, `limit` at a time, cut so the block the stream stops
 * inside is left to the next page, resuming exclusively after the row a cursor names.
 */
const explorerWith = (all: AleoPublicTransaction[]) =>
  mockFetchPage.mockImplementation(async ({ cursor, limit = 50, order = "asc" }) => {
    const direction = order === "desc" ? -1 : 1;
    const sorted = [...all].sort(
      (a, b) =>
        direction *
        (a.block_number - b.block_number || a.transition_id.localeCompare(b.transition_id)),
    );

    let remaining = sorted;
    if (cursor?.transitionId) {
      const named = sorted.findIndex(tx => tx.transition_id === cursor.transitionId);
      remaining = sorted.slice(named + 1);
    } else if (cursor) {
      remaining = sorted.filter(tx => direction * (tx.block_number - cursor.blockNumber) > 0);
    }

    let taken = Math.min(limit, remaining.length);
    for (;;) {
      const rows = remaining.slice(0, taken);
      if (rows.length === 0) return { transitions: [], next: null };

      const openBlock = rows[rows.length - 1].block_number;
      const whole = rows.filter(tx => tx.block_number !== openBlock);

      if (whole.length > 0) {
        const last = whole[whole.length - 1];
        return {
          transitions: whole,
          next: { blockNumber: last.block_number, transitionId: last.transition_id },
        };
      }

      // A single block filling the stream is handed over whole rather than split.
      if (taken >= remaining.length) return { transitions: rows, next: null };
      taken = Math.min(taken + limit, remaining.length);
    }
  });

/** The operation ids of every page of a listing, walked to exhaustion. */
const listAllPages = async (options: Parameters<typeof listOperations>[0]["options"]) => {
  const pages: string[][] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page++) {
    const result = await list({ ...options, ...(cursor && { cursor }) });
    pages.push(result.items.map(op => op.id));
    if (!result.next) return pages;
    cursor = result.next;
  }

  throw new Error("guard: listing did not terminate");
};

describe("logic/listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLastBlock.mockResolvedValue({ hash: "ab1", height: 1000, time: new Date() });
    mockScannerStatus.mockResolvedValue({ synced: true, percentage: 100, synced_up_to: 900 });
    mockOwnedRecords.mockResolvedValue([]);
    mockFetchPage.mockResolvedValue({ transitions: [], next: null });
    mockEnrich.mockResolvedValue([]);
  });

  describe("completeness ceiling", () => {
    it("caps the window at the scanner watermark, below the chain tip", async () => {
      explorerWith([publicTx("tx-below", 800), publicTx("tx-above", 950)]);

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-below"]);
    });

    it.each([
      ["a fully-synced scanner", { synced: true, percentage: 100 }],
      ["a scanner still catching up", { synced: false, percentage: 40 }],
    ])("withholds everything while synced_up_to is not served, even for %s", async (_, status) => {
      mockScannerStatus.mockResolvedValue(status);
      explorerWith([publicTx("tx-a", 100)]);

      expect(await list({ minHeight: 1 })).toEqual({ items: [], next: undefined });
    });

    it("clamps a cursor that reaches above the chain tip", async () => {
      explorerWith([publicTx("tx-a", 100), publicTx("tx-above-tip", 1500)]);

      const { items } = await list({ minHeight: 0, cursor: "5000:99:au1earlier" });

      expect(items.map(op => op.id)).toEqual(["tx-a"]);
    });

    it("reads the public history alone when the context carries no view key", async () => {
      explorerWith([publicTx("tx-a", 950)]);

      const { items } = await list({ minHeight: 0 }, {});

      // No scanner to wait for, so the ceiling is the chain tip and nothing private is read.
      expect(items.map(op => op.id)).toEqual(["tx-a"]);
      expect(mockScannerStatus).not.toHaveBeenCalled();
      expect(mockOwnedRecords).not.toHaveBeenCalled();
      expect(mockEnrich).not.toHaveBeenCalled();
    });
  });

  describe("empty ranges", () => {
    it("returns an empty page when the ceiling is below minHeight", async () => {
      expect(await list({ minHeight: 901 })).toEqual({ items: [], next: undefined });
      expect(mockFetchPage).not.toHaveBeenCalled();
    });

    it("still reads the block when the watermark sits exactly on minHeight", async () => {
      explorerWith([publicTx("tx-at-watermark", 900)]);

      const { items } = await list({ minHeight: 900 });

      expect(items.map(op => op.id)).toEqual(["tx-at-watermark"]);
    });

    it("returns an empty page when a pinned range is inverted", async () => {
      expect(await list({ minHeight: 900, cursor: "100:50:au1x" })).toEqual({
        items: [],
        next: undefined,
      });
      expect(mockFetchPage).not.toHaveBeenCalled();
    });
  });

  describe("opening the window", () => {
    it("opens an ascending listing on the block below minHeight", async () => {
      await list({ minHeight: 500 });

      expect(mockFetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { blockNumber: 499 }, order: "asc" }),
      );
    });

    it("asks for the account's first row when minHeight is zero", async () => {
      await list({ minHeight: 0 });

      expect(mockFetchPage).toHaveBeenCalledWith(
        expect.not.objectContaining({ cursor: expect.anything() }),
      );
    });

    it("opens a descending listing above the ceiling", async () => {
      await list({ minHeight: 0, order: "desc" });

      expect(mockFetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { blockNumber: 901 }, order: "desc" }),
      );
    });

    it("falls back to the explorer's own page size when asked for nothing", async () => {
      await list({ minHeight: 0, limit: 0 });

      expect(mockFetchPage).toHaveBeenCalledWith(
        expect.not.objectContaining({ limit: expect.anything() }),
      );
    });
  });

  describe("transaction rows", () => {
    it("keeps one row per transaction, preferring the one carrying an address", async () => {
      const inner = getMockedTransaction({
        transaction_id: "tx-batched",
        transition_id: "au1a",
        block_number: 500,
        sender_address: "",
        recipient_address: "",
      });
      const real = getMockedTransaction({
        transaction_id: "tx-batched",
        transition_id: "au1b",
        block_number: 500,
        sender_address: address,
        recipient_address: "aleo1receiver",
      });
      mockFetchPage.mockResolvedValue({ transitions: [inner, real], next: null });

      const { items } = await list({ minHeight: 0 });

      expect(items).toHaveLength(1);
      expect(items[0].senders).toEqual([address]);
    });

    it("breaks ties between address-less rows on transition_id", async () => {
      const rows = ["au1b", "au1a"].map(transitionId =>
        getMockedTransaction({
          transaction_id: "tx-none",
          transition_id: transitionId,
          block_number: 500,
          sender_address: "",
          recipient_address: "",
        }),
      );
      mockFetchPage.mockResolvedValue({ transitions: rows, next: null });

      const { items } = await list({ minHeight: 0 });

      expect(items).toHaveLength(1);
    });
  });

  describe("merging", () => {
    it("completes a shield from its owned record instead of leaving the recipient blank", async () => {
      const shield = getMockedTransaction({
        transaction_id: "tx-shield",
        transition_id: "au1shield",
        block_number: 500,
        function_id: "transfer_public_to_private",
        sender_address: address,
        recipient_address: "",
      });
      mockFetchPage.mockResolvedValue({ transitions: [shield], next: null });
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-shield", block_height: 500 }),
      ]);

      const { items } = await list({ minHeight: 0 });

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        id: "tx-shield",
        type: "OUT",
        senders: [address],
        recipients: [address],
      });
    });

    it("only decrypts records whose transaction has no public row", async () => {
      explorerWith([publicTx("tx-public", 500)]);
      const privateOnly = getMockedRecord({ transaction_id: "tx-private", block_height: 501 });
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-public", block_height: 500 }),
        privateOnly,
      ]);

      await list({ minHeight: 0 });

      expect(mockEnrich).toHaveBeenCalledWith(
        expect.objectContaining({ records: [privateOnly], viewKey }),
      );
    });

    it("emits private operations for a range holding no public rows at all", async () => {
      mockFetchPage.mockResolvedValue({ transitions: [], next: null });
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-private", block_height: 400 }),
      ]);

      await list({ minHeight: 0 });

      expect(mockOwnedRecords).toHaveBeenCalledWith(expect.objectContaining({ start: 0 }));
      expect(mockEnrich).toHaveBeenCalledWith(
        expect.objectContaining({ records: [expect.objectContaining({ block_height: 400 })] }),
      );
    });

    it("decrypts one record per transaction when a transaction owns several", async () => {
      const change = getMockedRecord({
        transaction_id: "tx-self",
        block_height: 500,
        output_index: 1,
      });
      const output = getMockedRecord({
        transaction_id: "tx-self",
        block_height: 500,
        output_index: 0,
      });
      mockOwnedRecords.mockResolvedValue([change, output]);

      await list({ minHeight: 0 });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [output] }));
    });

    it("picks the same record whatever order the scanner returns them in", async () => {
      const first = getMockedRecord({
        transaction_id: "tx-self",
        block_height: 500,
        output_index: 0,
      });
      const second = getMockedRecord({
        transaction_id: "tx-self",
        block_height: 500,
        output_index: 1,
      });

      mockOwnedRecords.mockResolvedValueOnce([first, second]);
      await list({ minHeight: 0 });
      const forward = mockEnrich.mock.calls.at(-1)?.[0].records;

      mockOwnedRecords.mockResolvedValueOnce([second, first]);
      await list({ minHeight: 0 });
      const reversed = mockEnrich.mock.calls.at(-1)?.[0].records;

      expect(forward).toEqual(reversed);
      expect(forward).toEqual([first]);
    });

    it("drops owned records above the ceiling", async () => {
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-above", block_height: 950 }),
      ]);

      await list({ minHeight: 0 });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [] }));
    });

    it("defers a record sitting past the blocks this page emitted", async () => {
      explorerWith([publicTx("tx-a", 100), publicTx("tx-b", 200), publicTx("tx-c", 300)]);
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-private", block_height: 250 }),
      ]);

      await list({ minHeight: 0, limit: 2 });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [] }));
    });

    it("defers a record below the blocks a descending page emitted", async () => {
      explorerWith([publicTx("tx-a", 800), publicTx("tx-b", 700), publicTx("tx-c", 600)]);
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-private", block_height: 650 }),
      ]);

      await list({ minHeight: 0, limit: 2, order: "desc" });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [] }));
    });
  });

  describe("ordering and paging", () => {
    const threeTxs = [publicTx("tx-c", 300), publicTx("tx-a", 100), publicTx("tx-b", 200)];

    it("orders ascending by default", async () => {
      explorerWith(threeTxs);

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.tx.block.height)).toEqual([100, 200]);
    });

    it("orders descending on request", async () => {
      explorerWith(threeTxs);

      const { items } = await list({ minHeight: 0, order: "desc" });

      expect(items.map(op => op.tx.block.height)).toEqual([300, 200]);
    });

    it("breaks ties on hash so operations at one height keep a stable order", async () => {
      mockFetchPage.mockResolvedValue({
        transitions: [publicTx("tx-b", 100), publicTx("tx-a", 100)],
        next: null,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
    });

    it("resumes at the exact row it stopped on, pinning the ceiling", async () => {
      explorerWith(threeTxs);

      const { next } = await list({ minHeight: 0, limit: 2 });

      expect(next).toBe("900:100:au1tx-a");
    });

    it("pages the range without overlap or gaps", async () => {
      explorerWith(threeTxs);

      expect(await listAllPages({ minHeight: 0, limit: 2 })).toEqual([
        ["tx-a"],
        ["tx-b"],
        ["tx-c"],
      ]);
    });

    it("pages a descending range without overlap or gaps", async () => {
      explorerWith(threeTxs);

      expect(await listAllPages({ minHeight: 0, limit: 2, order: "desc" })).toEqual([
        ["tx-c"],
        ["tx-b"],
        ["tx-a"],
      ]);
    });

    it("returns a block denser than the limit whole rather than splitting it", async () => {
      explorerWith([
        publicTx("tx-a", 100),
        publicTx("tx-b", 100),
        publicTx("tx-c", 100),
        publicTx("tx-d", 200),
      ]);

      // Over the asked-for limit, which the framework's soft limit allows: the alternative is
      // splitting a block, and only whole blocks can be paired with the record scanner.
      expect(await listAllPages({ minHeight: 0, limit: 2 })).toEqual([
        ["tx-a", "tx-b", "tx-c"],
        ["tx-d"],
      ]);
    });

    it("keeps the pinned ceiling as the scanner advances mid-run", async () => {
      explorerWith(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2 });

      mockScannerStatus.mockResolvedValue({ synced: true, percentage: 100, synced_up_to: 999 });
      explorerWith([...threeTxs, publicTx("tx-new", 950)]);
      const page2 = await list({ minHeight: 0, limit: 10, cursor: page1.next });

      expect(page2.items.map(op => op.id)).not.toContain("tx-new");
    });

    it("never emits a private-only record twice across pages", async () => {
      explorerWith(threeTxs);
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-private", block_height: 50 }),
      ]);
      mockEnrich.mockImplementation(async ({ records }) => records.map(enriched));

      const page1 = await list({ minHeight: 0, limit: 2 });
      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(page1.items.map(op => op.id)).toContain("tx-private");
      expect(page2.items.map(op => op.id)).not.toContain("tx-private");
    });

    it("advances the record window past the blocks an earlier page emitted", async () => {
      explorerWith(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2 });

      await list({ minHeight: 0, limit: 2, cursor: page1.next });

      // Page 1 emitted block 100 whole, so page 2 owns 101 upwards.
      expect(mockOwnedRecords).toHaveBeenLastCalledWith(expect.objectContaining({ start: 101 }));
    });

    it("returns the very same rows when a page is replayed", async () => {
      explorerWith(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2 });

      const replayed = await list({ minHeight: 0, limit: 2 });
      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });
      const page2Replayed = await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(replayed).toEqual(page1);
      expect(page2Replayed).toEqual(page2);
    });

    it("hands back no cursor on the last page", async () => {
      explorerWith(threeTxs);

      const pages = await listAllPages({ minHeight: 0, limit: 50 });

      expect(pages[pages.length - 1]).toEqual(["tx-c"]);
    });

    it("stops paging once the explorer walks out of the window", async () => {
      explorerWith([publicTx("tx-a", 100), publicTx("tx-above", 950), publicTx("tx-higher", 960)]);

      const { items, next } = await list({ minHeight: 0, limit: 3 });

      expect(items.map(op => op.id)).toEqual(["tx-a"]);
      expect(next).toBeUndefined();
    });

    it("terminates even when the window edge falls on a page boundary", async () => {
      explorerWith([publicTx("tx-a", 100), publicTx("tx-above", 950)]);

      expect(await listAllPages({ minHeight: 0, limit: 2 })).toEqual([["tx-a"], []]);
    });
  });

  describe("cursor validation", () => {
    it.each([["!!!nope!!!"], ["nine-hundred:100:au1x"], ["900:100:"], ["900:not-a-block:au1x"]])(
      "rejects the malformed cursor %p before any network call",
      async cursor => {
        await expect(list({ minHeight: 0, cursor })).rejects.toThrow(
          /malformed listOperations cursor/,
        );
        expect(mockLastBlock).not.toHaveBeenCalled();
      },
    );
  });
});
