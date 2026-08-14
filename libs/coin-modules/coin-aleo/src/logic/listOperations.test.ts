import { getMockedRecord, getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { fetchAllOwnedRecords, fetchRecordScannerStatus } from "../network/utils";
import { lastBlock } from "./lastBlock";
import { listOperations } from "./listOperations";
import { listPublicOperationsPage } from "./listPublicOperations";
import { enrichPrivateRecords } from "./listPrivateOperations";
import { decodeOperationsCursor, encodeOperationsCursor } from "./listOperations.helpers";

jest.mock("../network/utils");
jest.mock("./lastBlock");
jest.mock("./listPublicOperations");
jest.mock("./listPrivateOperations");

const mockLastBlock = jest.mocked(lastBlock);
const mockScannerStatus = jest.mocked(fetchRecordScannerStatus);
const mockOwnedRecords = jest.mocked(fetchAllOwnedRecords);
const mockPublicOperations = jest.mocked(listPublicOperationsPage);
const mockEnrich = jest.mocked(enrichPrivateRecords);

const config = getMockedConfig("mainnet");
const address = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";
const provableId = "uuid-1";
const viewKey = "AViewKey1secret";

const publicTx = (transactionId: string, blockNumber: number) =>
  getMockedTransaction({
    transaction_id: transactionId,
    block_number: blockNumber,
    sender_address: address,
    recipient_address: "aleo1receiver",
  });

const list = (options: Parameters<typeof listOperations>[0]["options"]) =>
  listOperations({ config, address, options, provableId, viewKey });

describe("logic/listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLastBlock.mockResolvedValue({
      hash: "ab1",
      height: 1000,
      time: new Date(),
    });
    mockScannerStatus.mockResolvedValue({
      synced: true,
      percentage: 100,
      synced_up_to: 900,
    });
    mockOwnedRecords.mockResolvedValue([]);
    mockPublicOperations.mockResolvedValue({
      transactions: [],
      complete: true,
    });
    mockEnrich.mockResolvedValue([]);
  });

  describe("completeness ceiling", () => {
    it("withholds operations above the scanner watermark", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-below", 800), publicTx("tx-above", 950)],
        complete: true,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-below"]);
    });

    it.each([
      ["a fully-synced scanner", { synced: true, percentage: 100 }],
      ["a scanner still catching up", { synced: false, percentage: 40 }],
    ])("withholds everything while synced_up_to is not served, even for %s", async (_, status) => {
      mockScannerStatus.mockResolvedValue(status);
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-1", 950)],
        complete: true,
      });

      expect(await list({ minHeight: 0 })).toEqual({
        items: [],
        next: undefined,
      });
    });

    it("clamps a cursor that reaches above the chain tip", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-1", 1500)],
        complete: true,
      });

      const { items } = await list({
        minHeight: 0,
        cursor: encodeOperationsCursor({
          minHeight: 0,
          maxBlockHeight: 5000,
          order: "asc",
        }),
      });

      expect(items).toEqual([]);
    });
  });

  describe("empty ranges", () => {
    it("returns an empty page when the ceiling is below minHeight", async () => {
      expect(await list({ minHeight: 901 })).toEqual({
        items: [],
        next: undefined,
      });
      expect(mockPublicOperations).not.toHaveBeenCalled();
    });

    it("still reads the block when the watermark sits exactly on minHeight", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-at-watermark", 900)],
        complete: true,
      });

      const { items } = await list({ minHeight: 900 });

      expect(items.map(op => op.id)).toEqual(["tx-at-watermark"]);
    });

    it("returns an empty page when a pinned range is inverted", async () => {
      const result = await list({
        minHeight: 900,
        cursor: encodeOperationsCursor({
          minHeight: 900,
          maxBlockHeight: 100,
          order: "asc",
        }),
      });

      expect(result).toEqual({ items: [], next: undefined });
    });
  });

  describe("merging", () => {
    it("completes a shield from its owned record instead of leaving the recipient blank", async () => {
      const shield = getMockedTransaction({
        transaction_id: "tx-shield",
        block_number: 500,
        function_id: "transfer_public_to_private",
        sender_address: address,
        recipient_address: "",
      });
      mockPublicOperations.mockResolvedValue({
        transactions: [shield],
        complete: true,
      });
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
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-public", 500)],
        complete: true,
      });
      const privateOnly = getMockedRecord({
        transaction_id: "tx-private",
        block_height: 501,
      });
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-public", block_height: 500 }),
        privateOnly,
      ]);

      await list({ minHeight: 0 });

      expect(mockEnrich).toHaveBeenCalledWith(
        expect.objectContaining({ records: [privateOnly], viewKey }),
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

    it("drops owned records that fall outside the window", async () => {
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-above", block_height: 950 }),
      ]);

      await list({ minHeight: 0 });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [] }));
    });
  });

  describe("ordering and paging", () => {
    const threeTxs = [publicTx("tx-c", 300), publicTx("tx-a", 100), publicTx("tx-b", 200)];

    /**
     * Stands in for the explorer walk: hands back at most `targetTransactions` rows from `startBlock`
     * onwards, and reports `complete` only once it has nothing left. That is the signal the paging
     * scheme runs on — the real one drops the transaction the stream ends on before returning.
     */
    const explorerHolding = (all: typeof threeTxs) =>
      mockPublicOperations.mockImplementation(
        async ({ startBlock, targetTransactions, order = "asc" }) => {
          const direction = order === "desc" ? -1 : 1;
          const sorted = [...all].sort(
            (a, b) =>
              direction *
              (a.block_number - b.block_number || a.transaction_id.localeCompare(b.transaction_id)),
          );
          const reachable = sorted.filter(tx =>
            startBlock === undefined
              ? true
              : order === "desc"
                ? tx.block_number <= startBlock
                : tx.block_number >= startBlock,
          );

          return reachable.length <= targetTransactions
            ? { transactions: reachable, complete: true }
            : {
                transactions: reachable.slice(0, targetTransactions),
                complete: false,
              };
        },
      );

    it("orders ascending by default", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: threeTxs,
        complete: true,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.tx.block.height)).toEqual([100, 200, 300]);
    });

    it("orders descending on request", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: threeTxs,
        complete: true,
      });

      const { items } = await list({ minHeight: 0, order: "desc" });

      expect(items.map(op => op.tx.block.height)).toEqual([300, 200, 100]);
    });

    it("breaks ties on hash so operations at one height keep a stable order", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-b", 100), publicTx("tx-a", 100)],
        complete: true,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
    });

    it("names the last emitted operation in the cursor it hands back", async () => {
      explorerHolding(threeTxs);

      const { next } = await list({ minHeight: 0, limit: 1 });

      expect(decodeOperationsCursor(next)).toEqual({
        minHeight: 0,
        maxBlockHeight: 900,
        order: "asc",
        resume: { block: 100, transactionId: "tx-a" },
      });
    });

    it("pages the range without overlap or gaps", async () => {
      explorerHolding(threeTxs);

      const page1 = await list({ minHeight: 0, limit: 2 });
      expect(page1.items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);

      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });
      expect(page2.items.map(op => op.id)).toEqual(["tx-c"]);
      expect(page2.next).toBeUndefined();
    });

    it("pages a descending range without overlap or gaps", async () => {
      explorerHolding(threeTxs);

      const page1 = await list({ minHeight: 0, limit: 2, order: "desc" });
      expect(page1.items.map(op => op.id)).toEqual(["tx-c", "tx-b"]);

      const page2 = await list({
        minHeight: 0,
        limit: 2,
        order: "desc",
        cursor: page1.next,
      });
      expect(page2.items.map(op => op.id)).toEqual(["tx-a"]);
      expect(page2.next).toBeUndefined();
    });

    it("narrows the upper bound when resuming a descending run", async () => {
      explorerHolding(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2, order: "desc" });

      expect(decodeOperationsCursor(page1.next)).toMatchObject({
        order: "desc",
        resume: { block: 200, transactionId: "tx-b" },
      });
    });

    it("resumes past the rows already emitted at the boundary height", async () => {
      // one height holding more operations than a page: the window reopens on it, so the earlier
      // page's rows come back in the stream and have to be dropped by identity, not by count
      explorerHolding([publicTx("tx-a", 100), publicTx("tx-b", 100), publicTx("tx-c", 100)]);

      const page1 = await list({ minHeight: 0, limit: 2 });
      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(page1.items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
      expect(page2.items.map(op => op.id)).toEqual(["tx-c"]);
    });

    it("widens the fetch rather than stall on a block denser than the page", async () => {
      // every row the resumed fetch can reach was already emitted, so the first attempt yields
      // nothing; without widening the cursor would never move
      explorerHolding([
        publicTx("tx-a", 100),
        publicTx("tx-b", 100),
        publicTx("tx-c", 100),
        publicTx("tx-d", 100),
      ]);

      const page1 = await list({ minHeight: 0, limit: 2 });
      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(page2.items.map(op => op.id)).toEqual(["tx-c", "tx-d"]);
    });

    it("keeps the pinned ceiling as the scanner advances mid-run", async () => {
      explorerHolding(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 1 });

      mockScannerStatus.mockResolvedValue({
        synced: true,
        percentage: 100,
        synced_up_to: 999,
      });
      explorerHolding([...threeTxs, publicTx("tx-new", 950)]);
      const page2 = await list({ minHeight: 0, limit: 10, cursor: page1.next });

      expect(page2.items.map(op => op.id)).not.toContain("tx-new");
    });

    it("narrows the record fetch to the resumed window", async () => {
      explorerHolding(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2 });

      await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(mockOwnedRecords).toHaveBeenLastCalledWith(expect.objectContaining({ start: 200 }));
    });

    it("starts the explorer walk at the resumed height instead of the account's first row", async () => {
      explorerHolding(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2 });

      await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(mockPublicOperations).toHaveBeenLastCalledWith(
        expect.objectContaining({ startBlock: 200, minBlockHeight: 200 }),
      );
    });

    // The resume point is an identity in the stream's total order, so it is only exact while that
    // order is reproducible between calls. This is the invariant the whole paging scheme rests on.
    it("returns the very same rows when a page is replayed", async () => {
      explorerHolding(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2 });

      const replayed = await list({ minHeight: 0, limit: 2 });
      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });
      const page2Replayed = await list({
        minHeight: 0,
        limit: 2,
        cursor: page1.next,
      });

      expect(replayed).toEqual(page1);
      expect(page2Replayed).toEqual(page2);
    });

    it("does not hand back a cursor once the range is exhausted", async () => {
      explorerHolding(threeTxs);

      expect((await list({ minHeight: 0, limit: 50 })).next).toBeUndefined();
    });

    it("makes progress even when the caller asks for nothing", async () => {
      explorerHolding(threeTxs);

      const { items } = await list({ minHeight: 0, limit: 0 });

      expect(items).toHaveLength(1);
    });
  });

  describe("cursor validation", () => {
    it("rejects a cursor replayed against a different range", async () => {
      const cursor = encodeOperationsCursor({
        minHeight: 0,
        maxBlockHeight: 900,
        order: "asc",
      });

      await expect(list({ minHeight: 5, cursor })).rejects.toThrow(
        /does not match the requested range/,
      );
    });

    it("rejects a malformed cursor before any network call", async () => {
      await expect(list({ minHeight: 0, cursor: "!!!nope!!!" })).rejects.toThrow(
        /malformed listOperations cursor/,
      );
      expect(mockLastBlock).not.toHaveBeenCalled();
    });
  });
});
