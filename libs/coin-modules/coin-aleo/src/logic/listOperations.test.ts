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
    mockPublicOperations.mockResolvedValue({ transactions: [], nextBlock: null });
    mockEnrich.mockResolvedValue([]);
  });

  describe("completeness ceiling", () => {
    it("caps the window at the scanner watermark, below the chain tip", async () => {
      await list({ minHeight: 0 });

      expect(mockPublicOperations).toHaveBeenCalledWith(
        expect.objectContaining({ fromBlock: 0, toBlock: 900 }),
      );
    });

    it.each([
      ["a fully-synced scanner", { synced: true, percentage: 100 }],
      ["a scanner still catching up", { synced: false, percentage: 40 }],
    ])("withholds everything while synced_up_to is not served, even for %s", async (_, status) => {
      mockScannerStatus.mockResolvedValue(status);

      await list({ minHeight: 0 });

      expect(mockPublicOperations).toHaveBeenCalledWith(
        expect.objectContaining({ fromBlock: 0, toBlock: 0 }),
      );
    });

    it("clamps a cursor that reaches above the chain tip", async () => {
      await list({
        minHeight: 0,
        cursor: encodeOperationsCursor({
          minHeight: 0,
          maxBlockHeight: 5000,
          order: "asc",
        }),
      });

      expect(mockPublicOperations).toHaveBeenCalledWith(expect.objectContaining({ toBlock: 1000 }));
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
        nextBlock: null,
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
      expect(mockPublicOperations).not.toHaveBeenCalled();
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
        nextBlock: null,
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
        nextBlock: null,
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

    it("drops owned records above the ceiling", async () => {
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-above", block_height: 950 }),
      ]);

      await list({ minHeight: 0 });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [] }));
    });

    it("defers a record sitting past the blocks this page emitted", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-a", 100)],
        nextBlock: 201,
      });
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-private", block_height: 250 }),
      ]);

      await list({ minHeight: 0, limit: 1 });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [] }));
    });

    it("defers a record below the blocks a descending page emitted", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-a", 800)],
        nextBlock: 700,
      });
      mockOwnedRecords.mockResolvedValue([
        getMockedRecord({ transaction_id: "tx-private", block_height: 650 }),
      ]);

      await list({ minHeight: 0, limit: 1, order: "desc" });

      expect(mockEnrich).toHaveBeenCalledWith(expect.objectContaining({ records: [] }));
    });
  });

  describe("ordering and paging", () => {
    const threeTxs = [publicTx("tx-c", 300), publicTx("tx-a", 100), publicTx("tx-b", 200)];

    /**
     * Stands in for the block-aligned explorer walk: returns whole blocks from the window until it
     * holds `minTransactions` rows, and reports the first block it left untouched.
     */
    const explorerHolding = (all: typeof threeTxs) =>
      mockPublicOperations.mockImplementation(
        async ({ fromBlock, toBlock, minTransactions, order = "asc" }) => {
          const direction = order === "desc" ? -1 : 1;
          const inWindow = all
            .filter(tx => tx.block_number >= fromBlock && tx.block_number <= toBlock)
            .sort(
              (a, b) =>
                direction *
                (a.block_number - b.block_number ||
                  a.transaction_id.localeCompare(b.transaction_id)),
            );
          const blocks = [...new Set(inWindow.map(tx => tx.block_number))];

          for (const [index, block] of blocks.entries()) {
            const transactions = inWindow.filter(tx => direction * (tx.block_number - block) <= 0);

            if (transactions.length >= minTransactions && index < blocks.length - 1) {
              return { transactions, nextBlock: block + direction };
            }
          }

          return { transactions: inWindow, nextBlock: null };
        },
      );

    it("orders ascending by default", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextBlock: null });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.tx.block.height)).toEqual([100, 200, 300]);
    });

    it("orders descending on request", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextBlock: null });

      const { items } = await list({ minHeight: 0, order: "desc" });

      expect(items.map(op => op.tx.block.height)).toEqual([300, 200, 100]);
    });

    it("breaks ties on hash so operations at one height keep a stable order", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-b", 100), publicTx("tx-a", 100)],
        nextBlock: null,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
    });

    it("resumes at the block after the last one it emitted", async () => {
      explorerHolding(threeTxs);

      const { next } = await list({ minHeight: 0, limit: 1 });

      expect(decodeOperationsCursor(next)).toEqual({
        minHeight: 0,
        maxBlockHeight: 900,
        order: "asc",
        nextBlock: 101,
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

    it("resumes below the last emitted block when descending", async () => {
      explorerHolding(threeTxs);

      const page1 = await list({ minHeight: 0, limit: 2, order: "desc" });

      expect(decodeOperationsCursor(page1.next)).toMatchObject({
        order: "desc",
        nextBlock: 199,
      });
    });

    it("returns a block denser than the limit whole rather than splitting it", async () => {
      explorerHolding([publicTx("tx-a", 100), publicTx("tx-b", 100), publicTx("tx-c", 100)]);

      const page = await list({ minHeight: 0, limit: 2 });

      expect(page.items.map(op => op.id)).toEqual(["tx-a", "tx-b", "tx-c"]);
      expect(page.next).toBeUndefined();
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

      expect(mockOwnedRecords).toHaveBeenLastCalledWith(expect.objectContaining({ start: 201 }));
    });

    it("starts the explorer walk at the resumed block instead of the account's first row", async () => {
      explorerHolding(threeTxs);
      const page1 = await list({ minHeight: 0, limit: 2 });

      await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(mockPublicOperations).toHaveBeenLastCalledWith(
        expect.objectContaining({ fromBlock: 201, toBlock: 900 }),
      );
    });

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
