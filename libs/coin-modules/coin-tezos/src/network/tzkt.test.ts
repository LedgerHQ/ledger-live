// tzkt.ts imports `network` from "@ledgerhq/live-network" (the package root, not the /network
// subpath). We mock the same path so Jest's module registry intercepts those calls.
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import coinConfig, { TezosCoinConfig } from "../config";
import { mockConfig } from "../test/config";
// Import fetchBlockTransactions / fetchBlockTokenTransfers through the index re-export
// so that network/index.ts line 4 is exercised and its coverage is tracked.
import type { APIBlock, APITokenTransfer, APITransactionType } from "./types";
import api from "./tzkt";
import { fetchBlockTransactions, fetchBlockTokenTransfers } from ".";

jest.mock("@ledgerhq/live-network");
jest.mock("@ledgerhq/logs");
const mockedNetwork = jest.mocked(network);
const mockedLog = jest.mocked(log);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps raw data into the shape that @ledgerhq/live-network resolves with. */
function networkResponse<T>(data: T) {
  return Promise.resolve({
    data,
    status: 200,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headers: {} as any,
    statusText: "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: { headers: {} as any },
  });
}

function makeApiBlock(level = 100): APIBlock {
  return { level, hash: `BLk${level}`, timestamp: "2024-01-01T00:00:00Z" } as APIBlock;
}

function makeTxItem(id: number): APITransactionType {
  return { id } as APITransactionType;
}

function makeTokenItem(id: number): APITokenTransfer {
  return { id } as APITokenTransfer;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("tzkt network API", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // api.getBlockByLevel
  // -------------------------------------------------------------------------

  describe("api.getBlockByLevel", () => {
    it("calls the correct URL and returns the block", async () => {
      const block = makeApiBlock(999);
      mockedNetwork.mockReturnValue(networkResponse(block) as ReturnType<typeof network>);

      const result = await api.getBlockByLevel(999);

      expect(result).toEqual(block);
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/blocks/999"),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // api.getBlockTransactionsPage
  // -------------------------------------------------------------------------

  describe("api.getBlockTransactionsPage", () => {
    it("fetches a page without a cursor", async () => {
      const txs: APITransactionType[] = [makeTxItem(1), makeTxItem(2)];
      mockedNetwork.mockReturnValue(networkResponse(txs) as ReturnType<typeof network>);

      const result = await api.getBlockTransactionsPage(200);

      expect(result).toEqual(txs);
      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({ level: 200, limit: 1000, "sort.asc": "id" });
      expect(params).not.toHaveProperty("offset.cr");
    });

    it("includes offset.cr in params when cursor is provided", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getBlockTransactionsPage(200, 42);

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params["offset.cr"]).toBe(42);
    });
  });

  // -------------------------------------------------------------------------
  // api.getBlockTokenTransfersPage
  // -------------------------------------------------------------------------

  describe("api.getBlockTokenTransfersPage", () => {
    it("fetches a page without a cursor", async () => {
      const items: APITokenTransfer[] = [makeTokenItem(10)];
      mockedNetwork.mockReturnValue(networkResponse(items) as ReturnType<typeof network>);

      const result = await api.getBlockTokenTransfersPage(300);

      expect(result).toEqual(items);
      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({ level: 300, limit: 1000, "sort.asc": "id" });
      expect(params).not.toHaveProperty("offset.cr");
    });

    it("includes offset.cr in params when cursor is provided", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getBlockTokenTransfersPage(300, 77);

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params["offset.cr"]).toBe(77);
    });
  });

  // -------------------------------------------------------------------------
  // fetchBlockTransactions — pagination logic
  // -------------------------------------------------------------------------

  describe("fetchBlockTransactions", () => {
    it("returns an empty array when the first page is empty", async () => {
      jest.spyOn(api, "getBlockTransactionsPage").mockResolvedValue([]);

      const result = await fetchBlockTransactions(100);

      expect(result).toEqual([]);
    });

    it("returns a single page when the page is smaller than the page size", async () => {
      const txs = [makeTxItem(1), makeTxItem(2)];
      jest.spyOn(api, "getBlockTransactionsPage").mockResolvedValue(txs);

      const result = await fetchBlockTransactions(100);

      expect(result).toEqual(txs);
    });

    it("fetches a second page when the first page is full (1 000 items)", async () => {
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeTxItem(i + 1));
      const lastPage = [makeTxItem(1001), makeTxItem(1002)];

      const spy = jest
        .spyOn(api, "getBlockTransactionsPage")
        .mockResolvedValueOnce(fullPage)
        .mockResolvedValueOnce(lastPage);

      const result = await fetchBlockTransactions(100);

      expect(result).toHaveLength(1002);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 100, undefined);
      // cursor = last item id of first page = 1000
      expect(spy).toHaveBeenNthCalledWith(2, 100, 1000);
    });

    it("stops after maxTxQuery iterations regardless of page length", async () => {
      // maxTxQuery = 100 (from mockConfig); every call returns a full page to keep the loop going
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeTxItem(i + 1));
      const spy = jest.spyOn(api, "getBlockTransactionsPage").mockResolvedValue(fullPage);

      const result = await fetchBlockTransactions(100);

      expect(spy).toHaveBeenCalledTimes(100);
      expect(result).toHaveLength(100_000);
      expect(mockedLog).toHaveBeenCalledWith(
        "tezos",
        expect.stringContaining("fetchBlockTransactions: maxTxQuery limit reached at level 100"),
      );
    });
  });

  // -------------------------------------------------------------------------
  // fetchBlockTokenTransfers — pagination logic
  // -------------------------------------------------------------------------

  describe("fetchBlockTokenTransfers", () => {
    it("returns an empty array when the first page is empty", async () => {
      jest.spyOn(api, "getBlockTokenTransfersPage").mockResolvedValue([]);

      const result = await fetchBlockTokenTransfers(100);

      expect(result).toEqual([]);
    });

    it("returns a single page when the page is smaller than the page size", async () => {
      const items = [makeTokenItem(1), makeTokenItem(2)];
      jest.spyOn(api, "getBlockTokenTransfersPage").mockResolvedValue(items);

      const result = await fetchBlockTokenTransfers(100);

      expect(result).toEqual(items);
    });

    it("fetches a second page when the first page is full (1 000 items)", async () => {
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeTokenItem(i + 1));
      const lastPage = [makeTokenItem(1001)];

      const spy = jest
        .spyOn(api, "getBlockTokenTransfersPage")
        .mockResolvedValueOnce(fullPage)
        .mockResolvedValueOnce(lastPage);

      const result = await fetchBlockTokenTransfers(100);

      expect(result).toHaveLength(1001);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 100, undefined);
      expect(spy).toHaveBeenNthCalledWith(2, 100, 1000);
    });

    it("stops after maxTxQuery iterations regardless of page length", async () => {
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeTokenItem(i + 1));
      const spy = jest.spyOn(api, "getBlockTokenTransfersPage").mockResolvedValue(fullPage);

      const result = await fetchBlockTokenTransfers(100);

      expect(spy).toHaveBeenCalledTimes(100);
      expect(result).toHaveLength(100_000);
      expect(mockedLog).toHaveBeenCalledWith(
        "tezos",
        expect.stringContaining("fetchBlockTokenTransfers: maxTxQuery limit reached at level 100"),
      );
    });
  });
});
