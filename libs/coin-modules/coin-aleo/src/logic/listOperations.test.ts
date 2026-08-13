import { getMockedRecord, getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { fetchAllOwnedRecords, fetchRecordScannerStatus } from "../network/utils";
import { lastBlock } from "./lastBlock";
import { listOperations } from "./listOperations";
import { listPublicOperations } from "./listPublicOperations";
import { enrichPrivateRecords } from "./listPrivateOperations";
import { decodeOperationsCursor, encodeOperationsCursor } from "./operationsCursor";

jest.mock("../network/utils");
jest.mock("./lastBlock");
jest.mock("./listPublicOperations");
jest.mock("./listPrivateOperations");

const mockLastBlock = jest.mocked(lastBlock);
const mockScannerStatus = jest.mocked(fetchRecordScannerStatus);
const mockOwnedRecords = jest.mocked(fetchAllOwnedRecords);
const mockPublicOperations = jest.mocked(listPublicOperations);
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
    mockLastBlock.mockResolvedValue({ hash: "ab1", height: 1000, time: new Date() });
    mockScannerStatus.mockResolvedValue({ synced: true, percentage: 100, synced_up_to: 900 });
    mockOwnedRecords.mockResolvedValue([]);
    mockPublicOperations.mockResolvedValue({ transactions: [], nextCursor: null });
    mockEnrich.mockResolvedValue([]);
  });

  describe("completeness ceiling", () => {
    it("withholds operations above the scanner watermark", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-below", 800), publicTx("tx-above", 950)],
        nextCursor: null,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-below"]);
    });

    it("falls back to the chain tip while synced_up_to is not served", async () => {
      mockScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-1", 950)],
        nextCursor: null,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-1"]);
    });

    it("returns nothing while the scanner is still catching up", async () => {
      mockScannerStatus.mockResolvedValue({ synced: false, percentage: 40 });

      expect(await list({ minHeight: 0 })).toEqual({ items: [], next: undefined });
    });

    it("clamps a cursor that reaches above the chain tip", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-1", 1500)],
        nextCursor: null,
      });

      const { items } = await list({
        minHeight: 0,
        cursor: encodeOperationsCursor({ minHeight: 0, maxBlockHeight: 5000, order: "asc" }),
      });

      expect(items).toEqual([]);
    });
  });

  describe("empty ranges", () => {
    it("returns an empty page when the ceiling is at or below minHeight", async () => {
      expect(await list({ minHeight: 900 })).toEqual({ items: [], next: undefined });
      expect(mockPublicOperations).not.toHaveBeenCalled();
    });

    it("returns an empty page when a pinned range is inverted", async () => {
      const result = await list({
        minHeight: 900,
        cursor: encodeOperationsCursor({ minHeight: 900, maxBlockHeight: 100, order: "asc" }),
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
      mockPublicOperations.mockResolvedValue({ transactions: [shield], nextCursor: null });
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
        nextCursor: null,
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

    it("orders ascending by default", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.tx.block.height)).toEqual([100, 200, 300]);
    });

    it("orders descending on request", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });

      const { items } = await list({ minHeight: 0, order: "desc" });

      expect(items.map(op => op.tx.block.height)).toEqual([300, 200, 100]);
    });

    it("breaks ties on hash so operations at one height keep a stable order", async () => {
      mockPublicOperations.mockResolvedValue({
        transactions: [publicTx("tx-b", 100), publicTx("tx-a", 100)],
        nextCursor: null,
      });

      const { items } = await list({ minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
    });

    it("pins the ceiling in the cursor it hands back", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });

      const { next } = await list({ minHeight: 0, limit: 1 });

      expect(decodeOperationsCursor(next)).toEqual({
        minHeight: 0,
        maxBlockHeight: 900,
        order: "asc",
        resume: { height: 100, emitted: 1 },
      });
    });

    it("pages the range without overlap or gaps", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });

      const page1 = await list({ minHeight: 0, limit: 2 });
      expect(page1.items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);

      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });
      expect(page2.items.map(op => op.id)).toEqual(["tx-c"]);
      expect(page2.next).toBeUndefined();
    });

    it("skips exactly the rows already emitted at the boundary height", async () => {
      const sameHeight = [publicTx("tx-a", 100), publicTx("tx-b", 100), publicTx("tx-c", 100)];
      mockPublicOperations.mockResolvedValue({ transactions: sameHeight, nextCursor: null });

      const page1 = await list({ minHeight: 0, limit: 2 });
      const page2 = await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(page1.items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
      expect(page2.items.map(op => op.id)).toEqual(["tx-c"]);
    });

    it("keeps the pinned ceiling as the scanner advances mid-run", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });
      const page1 = await list({ minHeight: 0, limit: 1 });

      mockScannerStatus.mockResolvedValue({ synced: true, percentage: 100, synced_up_to: 999 });
      mockPublicOperations.mockResolvedValue({
        transactions: [...threeTxs, publicTx("tx-new", 950)],
        nextCursor: null,
      });
      const page2 = await list({ minHeight: 0, limit: 10, cursor: page1.next });

      expect(page2.items.map(op => op.id)).not.toContain("tx-new");
    });

    it("narrows the record fetch to the resumed window", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });
      const page1 = await list({ minHeight: 0, limit: 2 });

      await list({ minHeight: 0, limit: 2, cursor: page1.next });

      expect(mockOwnedRecords).toHaveBeenLastCalledWith(expect.objectContaining({ start: 200 }));
    });

    it("does not hand back a cursor once the range is exhausted", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });

      expect((await list({ minHeight: 0, limit: 50 })).next).toBeUndefined();
    });

    it("makes progress even when the caller asks for nothing", async () => {
      mockPublicOperations.mockResolvedValue({ transactions: threeTxs, nextCursor: null });

      const { items } = await list({ minHeight: 0, limit: 0 });

      expect(items).toHaveLength(1);
    });
  });

  describe("cursor validation", () => {
    it("rejects a cursor replayed against a different range", async () => {
      const cursor = encodeOperationsCursor({ minHeight: 0, maxBlockHeight: 900, order: "asc" });

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
