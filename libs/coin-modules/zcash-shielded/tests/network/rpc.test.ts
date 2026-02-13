import network from "@ledgerhq/live-network";
import { ZCashRpcClient } from "../../src/network/rpc";

jest.mock("@ledgerhq/live-network");
const mockedNetwork = jest.mocked(network);

const NODE_URL = "https://zcash.example/rpc";

describe("ZCashRpcClient", () => {
  let client: ZCashRpcClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new ZCashRpcClient(NODE_URL);
  });

  describe("getBlockCount", () => {
    test("returns block count when network returns numeric result", async () => {
      mockedNetwork.mockResolvedValue({
        data: { result: 42 },
      } as ReturnType<typeof network> as never);
      const count = await client.getBlockCount();
      expect(count).toBe(42);
    });

    test("calls network with POST, nodeUrl, getblockcount method and empty params", async () => {
      mockedNetwork.mockResolvedValue({
        data: { result: 100 },
      } as ReturnType<typeof network> as never);
      await client.getBlockCount();
      expect(mockedNetwork).toHaveBeenCalledWith({
        method: "POST",
        url: NODE_URL,
        data: {
          jsonrpc: "1.0",
          id: "ledger",
          method: "getblockcount",
          params: [],
        },
      });
    });

    test("throws when RPC returns error", async () => {
      mockedNetwork.mockResolvedValue({
        data: { error: { code: -1, message: "node error" } },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockCount()).rejects.toThrow("Zcash RPC getblockcount failed");
      await expect(client.getBlockCount()).rejects.toThrow("node error");
    });

    test("throws when response has no result", async () => {
      mockedNetwork.mockResolvedValue({
        data: {},
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockCount()).rejects.toThrow("returned no result");
    });

    test("throws when result is not a number (string)", async () => {
      mockedNetwork.mockResolvedValue({
        data: { result: "100" },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockCount()).rejects.toThrow("unexpected type");
      await expect(client.getBlockCount()).rejects.toThrow("string");
    });

    test("throws when result is not a number (object)", async () => {
      mockedNetwork.mockResolvedValue({
        data: { result: {} },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockCount()).rejects.toThrow("unexpected type");
      await expect(client.getBlockCount()).rejects.toThrow("object");
    });
  });

  describe("getBlockByHeight", () => {
    test("returns block with height, time, hash when network returns valid block", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          result: { height: 5, time: 1000, hash: "abc" },
        },
      } as ReturnType<typeof network> as never);
      const block = await client.getBlockByHeight(5);
      expect(block).toEqual({ height: 5, time: 1000, hash: "abc" });
    });

    test("calls network with getblock method and height in params", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          result: { height: 3, time: 500, hash: "def" },
        },
      } as ReturnType<typeof network> as never);
      await client.getBlockByHeight(3);
      expect(mockedNetwork).toHaveBeenCalledWith({
        method: "POST",
        url: NODE_URL,
        data: {
          jsonrpc: "1.0",
          id: "ledger",
          method: "getblock",
          params: ["3"],
        },
      });
    });

    test("strips extra RPC fields and returns only height, time, hash", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          result: {
            height: 1,
            time: 100,
            hash: "h1",
            confirmations: 10,
            size: 1000,
            previousblockhash: "prev",
          },
        },
      } as ReturnType<typeof network> as never);
      const block = await client.getBlockByHeight(1);
      expect(block).toEqual({ height: 1, time: 100, hash: "h1" });
      expect(Object.keys(block)).toEqual(["height", "time", "hash"]);
    });

    test("throws when RPC returns error", async () => {
      mockedNetwork.mockResolvedValue({
        data: { error: { code: -1, message: "not found" } },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockByHeight(99)).rejects.toThrow("Zcash RPC getblock failed");
      await expect(client.getBlockByHeight(99)).rejects.toThrow("not found");
    });

    test("throws when response has no result", async () => {
      mockedNetwork.mockResolvedValue({
        data: {},
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockByHeight(0)).rejects.toThrow("returned no result");
    });

    test("throws when result is null", async () => {
      mockedNetwork.mockResolvedValue({
        data: { result: null },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockByHeight(0)).rejects.toThrow("getblock returned invalid block");
    });

    test("throws when result is undefined", async () => {
      mockedNetwork.mockResolvedValue({
        data: { result: undefined },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockByHeight(0)).rejects.toThrow("returned no result");
    });

    test("throws when height is not a number", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          result: { height: "5", time: 1000, hash: "abc" },
        },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockByHeight(5)).rejects.toThrow("getblock returned invalid block");
    });

    test("throws when time is not a number", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          result: { height: 5, time: "1000", hash: "abc" },
        },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockByHeight(5)).rejects.toThrow("getblock returned invalid block");
    });

    test("throws when hash is not a string", async () => {
      mockedNetwork.mockResolvedValue({
        data: {
          result: { height: 5, time: 1000, hash: 123 },
        },
      } as ReturnType<typeof network> as never);
      await expect(client.getBlockByHeight(5)).rejects.toThrow("getblock returned invalid block");
    });
  });
});
