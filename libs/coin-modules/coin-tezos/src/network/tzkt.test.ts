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
  APIStakingType,
  APITokenBalance,
  APITokenTransfer,
  APITransactionType,
  AccountsGetOperationsOptions,
} from "./types";
import api from "./tzkt";
import {
  fetchAllTransactions,
  fetchBlockDelegations,
  fetchBlockStaking,
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

function makeStakingItem(id: number): APIStakingType {
  return { id } as APIStakingType;
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

function makeTokenWithOrigId(id: number, originationId?: number): APITokenTransfer {
  return { ...makeTokenItem(id), originationId } as APITokenTransfer;
}

const localSpies: jest.SpyInstance[] = [];

function spyOnApi<K extends keyof typeof api>(method: K) {
  const spy = jest.spyOn(api, method);
  localSpies.push(spy);
  return spy;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("tzkt network API", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });

  afterEach(() => {
    localSpies.splice(0).forEach(spy => spy.mockRestore());
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
  // api.getOperationsOrigination
  // -------------------------------------------------------------------------

  describe("api.getOperationsOrigination", () => {
    it("fetches without cursor and strips undefined extra args", async () => {
      const originations: (APITransactionType & { block: string; hash: string })[] = [
        { id: 1, hash: "h1", block: "b1" } as APITransactionType & { hash: string; block: string },
      ];
      mockedNetwork.mockReturnValue(networkResponse(originations) as ReturnType<typeof network>);

      const result = await api.getOperationsOrigination(100, undefined, {
        foo: undefined,
        bar: "x",
      });

      expect(result).toEqual(originations);
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
          url: expect.stringContaining("/v1/operations/originations"),
        }),
      );
    });

    it("includes offset.cr when cursor is set", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getOperationsOrigination(5, 999);

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params["offset.cr"]).toBe(999);
    });
  });

  // -------------------------------------------------------------------------
  // api.getTokenTransfers
  // -------------------------------------------------------------------------

  describe("api.getTokenTransfers", () => {
    it("passes through params and strips undefined extra args", async () => {
      const transfers: APITokenTransfer[] = [makeTokenItem(1)];
      mockedNetwork.mockReturnValue(networkResponse(transfers) as ReturnType<typeof network>);

      const result = await api.getTokenTransfers({
        "level.gte": 200,
        unused: undefined,
        select: "id",
      });

      expect(result).toEqual(transfers);
      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({
        "level.gte": 200,
        select: "id",
      });
      expect(params).not.toHaveProperty("unused");
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/tokens/transfers"),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // api.getAccountTokenTransfers
  // -------------------------------------------------------------------------

  describe("api.getAccountTokenTransfers", () => {
    it("returns empty hash when no numeric transaction ids are present", async () => {
      const spyTx = spyOnApi("getOperationsTransactions");
      const spyOrig = spyOnApi("getOperationsOrigination");

      mockedNetwork.mockImplementation(async (config: { url: string }) => {
        if (config.url.includes("/v1/tokens/transfers")) {
          return networkResponse([
            makeTokenWithTxId(1, undefined),
            makeTokenWithTxId(2, undefined),
          ]) as ReturnType<typeof network>;
        }
        throw new Error(`unexpected url: ${config.url}`);
      });

      const result = await api.getAccountTokenTransfers("tz1x", {
        "level.ge": 10,
      });

      expect(spyTx).not.toHaveBeenCalled();
      expect(spyOrig).not.toHaveBeenCalled();
      expect(result).toEqual([]);
      const firstCall = mockedNetwork.mock.calls[0]?.[0] as {
        url: string;
        params?: Record<string, unknown>;
      };
      expect(firstCall.params).toMatchObject({
        "level.ge": 10,
        "sort.asc": "id",
        "anyof.from.to": "tz1x",
        "token.tokenId": "0",
        "token.standard": "fa2",
      });
    });

    it("joins operation hashes and uses empty string when no match", async () => {
      const spyTx = spyOnApi("getOperationsTransactions");
      const spyOrig = spyOnApi("getOperationsOrigination");
      mockedNetwork.mockImplementation(async (config: { url: string }) => {
        if (config.url.includes("/v1/tokens/transfers")) {
          return networkResponse([
            makeTokenWithTxId(1, 100),
            makeTokenWithTxId(2, 200),
          ]) as ReturnType<typeof network>;
        }
        if (config.url.includes("/v1/operations/transactions")) {
          return networkResponse([
            { id: 100, hash: "h100", block: "BLK100" } as APITransactionType & {
              hash: string;
              block: string;
            },
          ]) as ReturnType<typeof network>;
        }
        throw new Error(`unexpected url: ${config.url}`);
      });

      const result = await api.getAccountTokenTransfers("tz1y", {
        "level.ge": 0,
      });

      expect(result).toEqual([
        expect.objectContaining({ id: 1, hash: "h100", block: "BLK100" }),
        expect.objectContaining({ id: 2, hash: "", block: "" }),
      ]);
      expect(spyTx).toHaveBeenCalledWith(0, undefined, {
        "id.in": "100,200",
      });
      expect(spyOrig).not.toHaveBeenCalled();
    });

    it("attaches parent hash and block from originations when only originationIds are present", async () => {
      const spyTx = spyOnApi("getOperationsTransactions");
      const spyOrig = spyOnApi("getOperationsOrigination");
      mockedNetwork.mockImplementation(async (config: { url: string }) => {
        if (config.url.includes("/v1/tokens/transfers")) {
          return networkResponse([
            makeTokenWithOrigId(1, 100),
            makeTokenWithOrigId(2, 200),
          ]) as ReturnType<typeof network>;
        }
        if (config.url.includes("/v1/operations/originations")) {
          return networkResponse([
            { id: 100, hash: "h100", block: "BLK100" } as APITransactionType & {
              hash: string;
              block: string;
            },
            { id: 200, hash: "h200", block: "BLK200" } as APITransactionType & {
              hash: string;
              block: string;
            },
          ]) as ReturnType<typeof network>;
        }
        throw new Error(`unexpected url: ${config.url}`);
      });

      const result = await api.getAccountTokenTransfers("tz1o", {
        "level.ge": 0,
      });

      expect(spyTx).not.toHaveBeenCalled();
      expect(spyOrig).toHaveBeenCalledWith(0, undefined, {
        "id.in": "100,200",
      });
      expect(result).toEqual([
        expect.objectContaining({ id: 1, hash: "h100", block: "BLK100" }),
        expect.objectContaining({ id: 2, hash: "h200", block: "BLK200" }),
      ]);
    });

    it("joins both transactions and originations when both ids are present", async () => {
      const spyTx = spyOnApi("getOperationsTransactions");
      const spyOrig = spyOnApi("getOperationsOrigination");
      mockedNetwork.mockImplementation(async (config: { url: string }) => {
        if (config.url.includes("/v1/tokens/transfers")) {
          return networkResponse([
            makeTokenWithTxId(1, 100),
            makeTokenWithOrigId(2, 500),
          ]) as ReturnType<typeof network>;
        }
        if (config.url.includes("/v1/operations/transactions")) {
          return networkResponse([
            { id: 100, hash: "hTx", block: "BLK_TX" } as APITransactionType & {
              hash: string;
              block: string;
            },
          ]) as ReturnType<typeof network>;
        }
        if (config.url.includes("/v1/operations/originations")) {
          return networkResponse([
            { id: 500, hash: "hOrig", block: "BLK_ORIG" } as APITransactionType & {
              hash: string;
              block: string;
            },
          ]) as ReturnType<typeof network>;
        }
        throw new Error(`unexpected url: ${config.url}`);
      });

      const result = await api.getAccountTokenTransfers("tz1mix", {
        "level.ge": 0,
      });

      expect(spyTx).toHaveBeenCalledWith(0, undefined, {
        "id.in": "100",
      });
      expect(spyOrig).toHaveBeenCalledWith(0, undefined, {
        "id.in": "500",
      });
      expect(result).toEqual([
        expect.objectContaining({ id: 1, hash: "hTx", block: "BLK_TX" }),
        expect.objectContaining({ id: 2, hash: "hOrig", block: "BLK_ORIG" }),
      ]);
    });

    it("keeps partial hash/block from the parent transaction without dropping transfers", async () => {
      mockedNetwork.mockImplementation(async (config: { url: string }) => {
        if (config.url.includes("/v1/tokens/transfers")) {
          return networkResponse([
            makeTokenWithTxId(1, 100),
            makeTokenWithTxId(2, 200),
            makeTokenWithTxId(3, 300),
          ]) as ReturnType<typeof network>;
        }
        if (config.url.includes("/v1/operations/transactions")) {
          return networkResponse([
            { id: 100, hash: "h100", block: "" } as APITransactionType & {
              hash: string;
              block: string;
            },
            { id: 200, hash: "", block: "BLK200" } as APITransactionType & {
              hash: string;
              block: string;
            },
            { id: 300, hash: "h300", block: "BLK300" } as APITransactionType & {
              hash: string;
              block: string;
            },
          ]) as ReturnType<typeof network>;
        }
        throw new Error(`unexpected url: ${config.url}`);
      });
      const spyOrig = jest.spyOn(api, "getOperationsOrigination");

      const result = await api.getAccountTokenTransfers("tz1z", {
        "level.ge": 0,
      });

      expect(result).toEqual([
        expect.objectContaining({ id: 1, hash: "h100", block: "" }),
        expect.objectContaining({ id: 2, hash: "", block: "BLK200" }),
        expect.objectContaining({ id: 3, hash: "h300", block: "BLK300" }),
      ]);
      expect(spyOrig).not.toHaveBeenCalled();
    });

    it("keeps partial hash/block from the parent origination without dropping transfers", async () => {
      mockedNetwork.mockImplementation(async (config: { url: string }) => {
        if (config.url.includes("/v1/tokens/transfers")) {
          return networkResponse([
            makeTokenWithOrigId(1, 100),
            makeTokenWithOrigId(2, 200),
            makeTokenWithOrigId(3, 300),
          ]) as ReturnType<typeof network>;
        }
        if (config.url.includes("/v1/operations/originations")) {
          return networkResponse([
            { id: 100, hash: "h100", block: "" } as APITransactionType & {
              hash: string;
              block: string;
            },
            { id: 200, hash: "", block: "BLK200" } as APITransactionType & {
              hash: string;
              block: string;
            },
            { id: 300, hash: "h300", block: "BLK300" } as APITransactionType & {
              hash: string;
              block: string;
            },
          ]) as ReturnType<typeof network>;
        }
        throw new Error(`unexpected url: ${config.url}`);
      });
      const spyTx = jest.spyOn(api, "getOperationsTransactions");

      const result = await api.getAccountTokenTransfers("tz1origZ", {
        "level.ge": 0,
      });

      expect(result).toEqual([
        expect.objectContaining({ id: 1, hash: "h100", block: "" }),
        expect.objectContaining({ id: 2, hash: "", block: "BLK200" }),
        expect.objectContaining({ id: 3, hash: "h300", block: "BLK300" }),
      ]);
      expect(spyTx).not.toHaveBeenCalled();
    });

    it("uses sort.desc=id when sort is Descending and forwards level.lt / level.gt", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getAccountTokenTransfers("tz1sort", {
        sort: "Descending",
        "level.ge": 1,
        "level.lt": 9_000_000,
        limit: 50,
      });

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({
        "sort.desc": "id",
        "level.ge": 1,
        "level.lt": 9_000_000,
        limit: 50,
      });
      expect(params).not.toHaveProperty("sort.asc");
    });

    it("forwards level.gt for ascending continuation windows", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getAccountTokenTransfers("tz1asc", {
        sort: "Ascending",
        "level.ge": 100,
        "level.gt": 500,
      });

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({
        "sort.asc": "id",
        "level.ge": 100,
        "level.gt": 500,
      });
    });
  });

  // -------------------------------------------------------------------------
  // api.getUnstakeRequestsFinalizable
  // -------------------------------------------------------------------------

  describe("api.getUnstakeRequestsFinalizable", () => {
    it("queries finalizable unstake requests and sums actualAmount", async () => {
      mockedNetwork.mockReturnValue(networkResponse([100, 250, 7]) as ReturnType<typeof network>);

      const result = await api.getUnstakeRequestsFinalizable("tz1abc");

      expect(result).toEqual(357n);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/staking/unstake_requests"),
          params: {
            "staker.eq": "tz1abc",
            status: "finalizable",
            "select.values": "actualAmount",
            limit: 1000,
          },
        }),
      );
    });

    it("returns 0n when no finalizable requests exist", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      const result = await api.getUnstakeRequestsFinalizable("tz1empty");

      expect(result).toEqual(0n);
    });
  });

  // -------------------------------------------------------------------------
  // api.getUnstakeRequests
  // -------------------------------------------------------------------------

  describe("api.getUnstakeRequests", () => {
    it("queries pending and finalizable requests in chronological order", async () => {
      const fixture = [
        {
          id: 1,
          cycle: 100,
          baker: { address: "tz1baker" },
          staker: { address: "tz1abc" },
          firstTime: "2026-05-01T00:00:00Z",
          status: "pending",
          actualAmount: 60,
        },
        {
          id: 2,
          cycle: 99,
          baker: { address: "tz1baker" },
          staker: { address: "tz1abc" },
          firstTime: "2026-04-25T00:00:00Z",
          status: "finalizable",
          actualAmount: 40,
        },
      ];
      mockedNetwork.mockReturnValue(networkResponse(fixture) as ReturnType<typeof network>);

      const result = await api.getUnstakeRequests("tz1abc");

      expect(result).toEqual(fixture);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/staking/unstake_requests"),
          params: {
            "staker.eq": "tz1abc",
            "status.in": "pending,finalizable",
            "sort.asc": "id",
            limit: 1000,
          },
        }),
      );
    });

    it("returns an empty array when no requests match", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      const result = await api.getUnstakeRequests("tz1empty");

      expect(result).toEqual([]);
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
      spyOnApi("getAccountOperations").mockResolvedValue([]);

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
      spyOnApi("getAccountOperations").mockResolvedValue([opMissingId]);

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
  // api.getBlockHashesByLevels
  // -------------------------------------------------------------------------

  describe("api.getBlockHashesByLevels", () => {
    it("returns an empty map without calling the network when given no levels", async () => {
      const result = await api.getBlockHashesByLevels([]);

      expect(result).toEqual(new Map());
      expect(mockedNetwork).not.toHaveBeenCalled();
    });

    it("batches all levels in one request and returns a level→hash map", async () => {
      mockedNetwork.mockReturnValue(
        networkResponse([
          [1234, "BL-hash-1234"],
          [1235, "BL-hash-1235"],
        ]) as ReturnType<typeof network>,
      );

      const result = await api.getBlockHashesByLevels([1234, 1235]);

      expect(result).toEqual(
        new Map([
          [1234, "BL-hash-1234"],
          [1235, "BL-hash-1235"],
        ]),
      );
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringMatching(/\/v1\/blocks$/),
          params: { "level.in": "1234,1235", "select.values": "level,hash", limit: 2 },
        }),
      );
    });

    it("omits levels that the API did not return", async () => {
      mockedNetwork.mockReturnValue(
        networkResponse([[1234, "BL-hash-1234"]]) as ReturnType<typeof network>,
      );

      const result = await api.getBlockHashesByLevels([1234, 9999]);

      expect(result).toEqual(new Map([[1234, "BL-hash-1234"]]));
      expect(result.has(9999)).toBe(false);
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
      spyOnApi("getBlockTransactionsPage").mockResolvedValue([]);

      const result = await fetchBlockTransactions(100);

      expect(result).toEqual([]);
    });

    it("returns a single page when the page is smaller than the page size", async () => {
      const txs = [makeTxItem(1), makeTxItem(2)];
      spyOnApi("getBlockTransactionsPage").mockResolvedValue(txs);

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
      const spy = spyOnApi("getBlockTransactionsPage").mockResolvedValue(fullPage);

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
      spyOnApi("getBlockTokenTransfersPage").mockResolvedValue([]);

      const result = await fetchBlockTokenTransfers(100);

      expect(result).toEqual([]);
    });

    it("returns a single page when the page is smaller than the page size", async () => {
      const items = [makeTokenItem(1), makeTokenItem(2)];
      spyOnApi("getBlockTokenTransfersPage").mockResolvedValue(items);

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
      const spy = spyOnApi("getBlockTokenTransfersPage").mockResolvedValue(fullPage);

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
      spyOnApi("getBlockDelegationsPage").mockResolvedValue([]);

      const result = await fetchBlockDelegations(100);

      expect(result).toEqual([]);
    });

    it("returns a single page when the page is smaller than the page size", async () => {
      const items = [makeDelegationItem(1), makeDelegationItem(2)];
      spyOnApi("getBlockDelegationsPage").mockResolvedValue(items);

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
      const spy = spyOnApi("getBlockDelegationsPage").mockResolvedValue(fullPage);

      const result = await fetchBlockDelegations(100);

      expect(spy).toHaveBeenCalledTimes(100);
      expect(result).toHaveLength(100_000);
      expect(mockedLog).toHaveBeenCalledWith(
        "tezos",
        expect.stringContaining("fetchBlockDelegations: maxTxQuery limit reached at level 100"),
      );
    });
  });

  // -------------------------------------------------------------------------
  // api.getBlockStakingPage
  // -------------------------------------------------------------------------

  describe("api.getBlockStakingPage", () => {
    it("fetches a page without a cursor", async () => {
      const items: APIStakingType[] = [makeStakingItem(10)];
      mockedNetwork.mockReturnValue(networkResponse(items) as ReturnType<typeof network>);

      const result = await api.getBlockStakingPage(400);

      expect(result).toEqual(items);
      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params).toMatchObject({ level: 400, limit: 1000, "sort.asc": "id" });
      expect(params).not.toHaveProperty("offset.cr");
    });

    it("includes offset.cr in params when cursor is provided", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getBlockStakingPage(400, 88);

      const params = (mockedNetwork.mock.calls[0][0] as { params: Record<string, unknown> }).params;
      expect(params["offset.cr"]).toBe(88);
    });

    it("calls the staking endpoint", async () => {
      mockedNetwork.mockReturnValue(networkResponse([]) as ReturnType<typeof network>);

      await api.getBlockStakingPage(500);

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/v1/operations/staking"),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // fetchBlockStaking — pagination logic
  // -------------------------------------------------------------------------

  describe("fetchBlockStaking", () => {
    it("returns an empty array when the first page is empty", async () => {
      spyOnApi("getBlockStakingPage").mockResolvedValue([]);

      const result = await fetchBlockStaking(100);

      expect(result).toEqual([]);
    });

    it("returns a single page when the page is smaller than the page size", async () => {
      const items = [makeStakingItem(1), makeStakingItem(2)];
      spyOnApi("getBlockStakingPage").mockResolvedValue(items);

      const result = await fetchBlockStaking(100);

      expect(result).toEqual(items);
    });

    it("fetches a second page when the first page is full (1 000 items)", async () => {
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeStakingItem(i + 1));
      const lastPage = [makeStakingItem(1001)];

      const spy = jest
        .spyOn(api, "getBlockStakingPage")
        .mockResolvedValueOnce(fullPage)
        .mockResolvedValueOnce(lastPage);

      const result = await fetchBlockStaking(100);

      expect(result).toHaveLength(1001);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 100, undefined);
      expect(spy).toHaveBeenNthCalledWith(2, 100, 1000);
    });

    it("stops after maxTxQuery iterations regardless of page length", async () => {
      const fullPage = Array.from({ length: 1000 }, (_, i) => makeStakingItem(i + 1));
      const spy = spyOnApi("getBlockStakingPage").mockResolvedValue(fullPage);

      const result = await fetchBlockStaking(100);

      expect(spy).toHaveBeenCalledTimes(100);
      expect(result).toHaveLength(100_000);
      expect(mockedLog).toHaveBeenCalledWith(
        "tezos",
        expect.stringContaining("fetchBlockStaking: maxTxQuery limit reached at level 100"),
      );
    });
  });
});
