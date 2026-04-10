// tzkt.ts imports `network` from "@ledgerhq/live-network" (the package root, not the /network
// subpath). We mock the same path so Jest's module registry intercepts those calls.
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import coinConfig, { TezosCoinConfig } from "../config";
import { mockConfig } from "../test/config";
// Import fetchBlockTransactions / fetchBlockTokenTransfers / fetchBlockDelegations through the index re-export
// so that network/index.ts line 4 is exercised and its coverage is tracked.
import type {
  APIAccount,
  APIBlock,
  APIDelegationType,
  APIOperation,
  APITokenBalance,
  APITokenTransfer,
  APITransactionType,
  AccountsGetOperationsOptions,
} from "./types";
import api from "./tzkt";
import {
  fetchAllTransactions,
  fetchBlockDelegations,
  fetchBlockTokenTransfers,
  fetchBlockTransactions,
} from ".";

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

function makeDelegationItem(id: number): APIDelegationType {
  return { id } as APIDelegationType;
}

function makeOperation(id: number): APIOperation {
  return {
    id,
    type: "transaction",
    timestamp: "2024-01-01T00:00:00Z",
    level: 1,
    block: "blk",
    amount: 0,
    counter: 0,
    initiator: null,
    sender: null,
    target: null,
  } as APIOperation;
}

function makeTokenWithTxId(id: number, transactionId?: number): APITokenTransfer {
  return { ...makeTokenItem(id), transactionId } as APITokenTransfer;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("tzkt network API", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // api.getBlockCount
  // -------------------------------------------------------------------------

  describe("api.getBlockCount", () => {
    it("calls the blocks count endpoint and returns the number", async () => {
      mockedNetwork.mockReturnValue(networkResponse(12_345) as ReturnType<typeof network>);

      const result = await api.getBlockCount();

      expect(result).toBe(12_345);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringMatching(/\/v1\/blocks\/count$/),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // api.getLastBlock
  // -------------------------------------------------------------------------

  describe("api.getLastBlock", () => {
    it("returns hash, level and date from the first block in the sorted list", async () => {
      const blocks = [makeApiBlock(9_001)];
      mockedNetwork.mockReturnValue(networkResponse(blocks) as ReturnType<typeof network>);

      const result = await api.getLastBlock();

      expect(result).toEqual({
        hash: blocks[0].hash,
        level: 9_001,
        date: new Date(blocks[0].timestamp),
      });
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/blocks"),
          params: { "sort.desc": "level" },
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // api.getAccountByAddress
  // -------------------------------------------------------------------------

  describe("api.getAccountByAddress", () => {
    it("calls the account endpoint and returns the account payload", async () => {
      const account = { type: "empty", address: "tz1abc", counter: 0 } as APIAccount;
      mockedNetwork.mockReturnValue(networkResponse(account) as ReturnType<typeof network>);

      const result = await api.getAccountByAddress("tz1abc");

      expect(result).toEqual(account);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/accounts/tz1abc"),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // api.getAccountOperations
  // -------------------------------------------------------------------------

  describe("api.getAccountOperations", () => {
    it("requests operations with serialized query", async () => {
      const ops: APIOperation[] = [makeOperation(1)];
      mockedNetwork.mockReturnValue(networkResponse(ops) as ReturnType<typeof network>);

      const result = await api.getAccountOperations("tz1addr", {
        lastId: 10,
        limit: 50,
        sort: "Ascending",
        "level.ge": 0,
      });

      expect(result).toEqual(ops);
      const call = mockedNetwork.mock.calls[0][0] as { url: string };
      expect(call.url).toContain("/v1/accounts/tz1addr/operations");
      expect(call.url).toContain("lastId=10");
      expect(call.url).toContain("limit=50");
      expect(call.url).toContain("sort=Ascending");
      expect(call.url).toContain("level.ge=0");
    });

    it("omits undefined optional fields from the serialized query", async () => {
      const ops: APIOperation[] = [makeOperation(1)];
      mockedNetwork.mockReturnValue(networkResponse(ops) as ReturnType<typeof network>);
      const query = {
        lastId: undefined as number | undefined,
        limit: 40,
        sort: "Ascending" as const,
        "level.ge": 0,
      };

      await api.getAccountOperations("tz1addr", query);

      const call = mockedNetwork.mock.calls[0][0] as { url: string };
      expect(call.url).not.toMatch(/lastId=/);
      expect(call.url).toContain("limit=40");
    });
  });

  // -------------------------------------------------------------------------
  // api.getOperationsTransactions
  // -------------------------------------------------------------------------

  describe("api.getOperationsTransactions", () => {
    it("fetches without cursor and strips undefined extra args", async () => {
      const txs: APITransactionType[] = [makeTxItem(1)];
      mockedNetwork.mockReturnValue(networkResponse(txs) as ReturnType<typeof network>);

      const result = await api.getOperationsTransactions(100, undefined, {
        foo: undefined,
        bar: "x",
      });

      expect(result).toEqual(txs);
      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({
        "level.gte": 100,
        limit: 1000,
        "sort.asc": "id",
        bar: "x",
      });
      expect(params).not.toHaveProperty("foo");
      expect(params).not.toHaveProperty("offset.cr");
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/operations/transactions"),
        }),
      );
    });

    it("includes offset.cr when cursor is set", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getOperationsTransactions(5, 999);

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params["offset.cr"]).toBe(999);
    });
  });

  // -------------------------------------------------------------------------
  // api.getTokenTransfers
  // -------------------------------------------------------------------------

  describe("api.getTokenTransfers", () => {
    it("fetches without cursor and strips undefined extra args", async () => {
      const transfers: APITokenTransfer[] = [makeTokenItem(1)];
      mockedNetwork.mockReturnValue(networkResponse(transfers) as ReturnType<typeof network>);

      const result = await api.getTokenTransfers(200, undefined, {
        unused: undefined,
        select: "id",
      });

      expect(result).toEqual(transfers);
      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({
        "level.gte": 200,
        limit: 1000,
        "sort.asc": "id",
        select: "id",
      });
      expect(params).not.toHaveProperty("unused");
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/tokens/transfers"),
        }),
      );
    });

    it("includes offset.cr when cursor is set", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getTokenTransfers(1, 55);

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params["offset.cr"]).toBe(55);
    });
  });

  // -------------------------------------------------------------------------
  // api.getAccountTokenTransfers
  // -------------------------------------------------------------------------

  describe("api.getAccountTokenTransfers", () => {
    it("returns empty hash when no numeric transaction ids are present", async () => {
      const spyToken = jest
        .spyOn(api, "getTokenTransfers")
        .mockResolvedValue([makeTokenWithTxId(1, undefined), makeTokenWithTxId(2, undefined)]);
      const spyTx = jest.spyOn(api, "getOperationsTransactions");

      const result = await api.getAccountTokenTransfers("tz1x", {
        "level.ge": 10,
      });

      expect(spyTx).not.toHaveBeenCalled();
      expect(result).toEqual([
        expect.objectContaining({ id: 1, hash: "" }),
        expect.objectContaining({ id: 2, hash: "" }),
      ]);
      expect(spyToken).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({
          "anyof.from.to": "tz1x",
          "token.tokenId": "0",
          "token.standard": "fa2",
        }),
      );
    });

    it("joins operation hashes and uses empty string when no match", async () => {
      jest
        .spyOn(api, "getTokenTransfers")
        .mockResolvedValue([makeTokenWithTxId(1, 100), makeTokenWithTxId(2, 200)]);
      jest
        .spyOn(api, "getOperationsTransactions")
        .mockResolvedValue([{ id: 100, hash: "h100" } as APITransactionType]);

      const result = await api.getAccountTokenTransfers("tz1y", {
        "level.ge": 0,
        lastId: 7,
      });

      expect(result).toEqual([
        expect.objectContaining({ id: 1, hash: "h100" }),
        expect.objectContaining({ id: 2, hash: "" }),
      ]);
      expect(api.getOperationsTransactions).toHaveBeenCalledWith(0, undefined, {
        "id.in": "100,200",
      });
    });
  });

  // -------------------------------------------------------------------------
  // api.getTokensBalances
  // -------------------------------------------------------------------------

  describe("api.getTokensBalances", () => {
    it("requests FA2 tokenId 0 balances for the account", async () => {
      const balances = [{ id: 1 } as APITokenBalance];
      mockedNetwork.mockReturnValue(networkResponse(balances) as ReturnType<typeof network>);

      const result = await api.getTokensBalances("tz1bal");

      expect(result).toEqual(balances);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/tokens/balances"),
          params: {
            account: "tz1bal",
            "token.standard": "fa2",
            "token.tokenId": "0",
          },
        }),
      );
    });

    it("requests a specific FA2 contract and token id when a filter is passed", async () => {
      const balances = [{ id: 2 } as APITokenBalance];
      mockedNetwork.mockReturnValue(networkResponse(balances) as ReturnType<typeof network>);

      const result = await api.getTokensBalances("tz1bal", {
        contractAddress: "KT1abc",
        tokenId: 7,
      });

      expect(result).toEqual(balances);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/tokens/balances"),
          params: {
            account: "tz1bal",
            "token.standard": "fa2",
            "token.contract": "KT1abc",
            "token.tokenId": "7",
          },
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // fetchAllTransactions
  // -------------------------------------------------------------------------

  describe("fetchAllTransactions", () => {
    it("returns empty when the first page is empty", async () => {
      jest.spyOn(api, "getAccountOperations").mockResolvedValue([]);

      const result = await fetchAllTransactions("tz1acc");

      expect(result).toEqual([]);
    });

    it("concatenates pages until an empty response", async () => {
      const spy = jest
        .spyOn(api, "getAccountOperations")
        .mockResolvedValueOnce([makeOperation(1)])
        .mockResolvedValueOnce([makeOperation(2)])
        .mockResolvedValueOnce([]);

      const result = await fetchAllTransactions("tz1acc");

      expect(result).toEqual([makeOperation(1), makeOperation(2)]);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, "tz1acc", {
        lastId: undefined,
        sort: "Ascending",
        "level.ge": 0,
      });
      expect(spy).toHaveBeenNthCalledWith(2, "tz1acc", {
        lastId: 1,
        sort: "Ascending",
        "level.ge": 0,
      });
    });

    it("logs and returns when the last operation has a falsy id", async () => {
      const opMissingId = { ...makeOperation(1), id: 0 } as APIOperation;
      jest.spyOn(api, "getAccountOperations").mockResolvedValue([opMissingId]);

      const result = await fetchAllTransactions("tz1acc");

      expect(result).toEqual([opMissingId]);
      expect(mockedLog).toHaveBeenCalledWith("tezos", "id missing!");
    });

    it("stops after maxTxQuery iterations", async () => {
      const spy = jest
        .spyOn(api, "getAccountOperations")
        .mockImplementation(async (_addr: string, opts: AccountsGetOperationsOptions) => {
          // Always one op with a truthy id so the loop would continue without the cap
          return [makeOperation((opts.lastId ?? 0) + 1)];
        });

      const result = await fetchAllTransactions("tz1acc");

      expect(spy).toHaveBeenCalledTimes(mockConfig.explorer.maxTxQuery);
      expect(result).toHaveLength(mockConfig.explorer.maxTxQuery);
    });
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

  // -------------------------------------------------------------------------
  // api.getBlockDelegationsPage
  // -------------------------------------------------------------------------

  describe("api.getBlockDelegationsPage", () => {
    it("fetches a page without a cursor", async () => {
      const items: APIDelegationType[] = [makeDelegationItem(10)];
      mockedNetwork.mockReturnValue(networkResponse(items) as ReturnType<typeof network>);

      const result = await api.getBlockDelegationsPage(400);

      expect(result).toEqual(items);
      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({ level: 400, limit: 1000, "sort.asc": "id" });
      expect(params).not.toHaveProperty("offset.cr");
    });

    it("includes offset.cr in params when cursor is provided", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getBlockDelegationsPage(400, 88);

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params["offset.cr"]).toBe(88);
    });

    it("calls the delegations endpoint", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getBlockDelegationsPage(500);

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/operations/delegations"),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // fetchBlockDelegations — pagination logic
  // -------------------------------------------------------------------------

  describe("fetchBlockDelegations", () => {
    it("returns an empty array when the first page is empty", async () => {
      jest.spyOn(api, "getBlockDelegationsPage").mockResolvedValue([]);

      const result = await fetchBlockDelegations(100);

      expect(result).toEqual([]);
    });

    it("returns a single page when the page is smaller than the page size", async () => {
      const items = [makeDelegationItem(1), makeDelegationItem(2)];
      jest.spyOn(api, "getBlockDelegationsPage").mockResolvedValue(items);

      const result = await fetchBlockDelegations(100);

      expect(result).toEqual(items);
    });

    it("fetches a second page when the first page is full (1 000 items)", async () => {
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeDelegationItem(i + 1));
      const lastPage = [makeDelegationItem(1001)];

      const spy = jest
        .spyOn(api, "getBlockDelegationsPage")
        .mockResolvedValueOnce(fullPage)
        .mockResolvedValueOnce(lastPage);

      const result = await fetchBlockDelegations(100);

      expect(result).toHaveLength(1001);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 100, undefined);
      expect(spy).toHaveBeenNthCalledWith(2, 100, 1000);
    });

    it("stops after maxTxQuery iterations regardless of page length", async () => {
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeDelegationItem(i + 1));
      const spy = jest.spyOn(api, "getBlockDelegationsPage").mockResolvedValue(fullPage);

      const result = await fetchBlockDelegations(100);

      expect(spy).toHaveBeenCalledTimes(100);
      expect(result).toHaveLength(100_000);
      expect(mockedLog).toHaveBeenCalledWith(
        "tezos",
        expect.stringContaining("fetchBlockDelegations: maxTxQuery limit reached at level 100"),
      );
    });
  });
});
