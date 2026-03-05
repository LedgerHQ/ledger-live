import type { Operation } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import { defaultFetchParams, fetchTronAccountTxs, getBlock } from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TrongridTxInfo } from "../types";
import { defaultOptions, listOperations } from "./listOperations";

jest.mock("../network", () => ({
  fetchTronAccountTxs: jest.fn(),
  getBlock: jest.fn(),
  toBlock: jest.requireActual("../network").toBlock,
}));

jest.mock("../network/trongrid/trongrid-adapters", () => ({
  fromTrongridTxInfoToOperation: jest.fn(),
}));

const toBlockResponse = (height: number, hash: string, time: Date) => ({
  blockID: hash,
  block_header: { raw_data: { number: height, timestamp: time.getTime() } },
});

describe("listOperations", () => {
  const mockAddress = "tronExampleAddress";

  const mockBlockTime = new Date("2023-01-01T00:00:00Z");
  const mockBlockTimestamp = mockBlockTime.getTime();
  beforeEach(() => {
    jest.clearAllMocks();
    (getBlock as jest.Mock).mockResolvedValue(toBlockResponse(0, "blockhash", mockBlockTime));
  });

  const expectedFetchParams = {
    ...defaultFetchParams,
    minTimestamp: mockBlockTimestamp,
    hintGlobalLimit: 1000,
    order: "desc",
  };

  it("should fetch transactions and return operations", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "tx1", value: new BigNumber(0) },
      { txID: "tx2", value: new BigNumber(42) },
    ];

    const expectedOperations: Partial<Operation>[] = [
      { tx: { hash: "tx1" } as Partial<Operation>["tx"], value: BigInt(0) },
      { tx: { hash: "tx2" } as Partial<Operation>["tx"], value: BigInt(42) },
    ];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation((tx, _block) => {
      return {
        tx: { hash: tx.txID },
        value: BigInt(tx.value.toString()),
      };
    });

    const [operations, token] = await listOperations(mockAddress, defaultOptions);

    expect(fetchTronAccountTxs).toHaveBeenCalledWith(
      mockAddress,
      expect.any(Function),
      {},
      expectedFetchParams,
    );
    expect(fromTrongridTxInfoToOperation).toHaveBeenCalledTimes(mockTxs.length);
    expect(operations).toEqual(expectedOperations);
    expect(token).toBe("");
  });

  it("should handle empty transactions", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [];
    const expectedOperations: Partial<Operation>[] = [];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(() => null);

    const [operations, token] = await listOperations(mockAddress, defaultOptions);

    expect(fetchTronAccountTxs).toHaveBeenCalledWith(
      mockAddress,
      expect.any(Function),
      {},
      expectedFetchParams,
    );
    expect(operations).toEqual(expectedOperations);
    expect(token).toBe("");
  });

  it("should handle errors from fetchTronAccountTxs", async () => {
    const exampleError = new Error("Network error!");
    (fetchTronAccountTxs as jest.Mock).mockRejectedValue(exampleError);

    await expect(listOperations(mockAddress, defaultOptions)).rejects.toThrow(
      new Error(exampleError.message),
    );
  });

  it("should fetch blocks for unique heights and cache them", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "tx1", value: new BigNumber(0), blockHeight: 100 },
      { txID: "tx2", value: new BigNumber(10), blockHeight: 200 },
      { txID: "tx3", value: new BigNumber(20), blockHeight: 100 },
      { txID: "tx4", value: new BigNumber(30), blockHeight: 300 },
      { txID: "tx5", value: new BigNumber(40), blockHeight: 200 },
    ];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (getBlock as jest.Mock)
      .mockResolvedValueOnce(toBlockResponse(0, "hash0", mockBlockTime))
      .mockResolvedValueOnce(toBlockResponse(100, "hash100", new Date("2023-01-01T01:00:00Z")))
      .mockResolvedValueOnce(toBlockResponse(200, "hash200", new Date("2023-01-01T02:00:00Z")))
      .mockResolvedValueOnce(toBlockResponse(300, "hash300", new Date("2023-01-01T03:00:00Z")));

    const operationBlocks: Array<{ height: number; hash: string }> = [];
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation((tx, block) => {
      operationBlocks.push({ height: block.height, hash: block.hash });
      return {
        tx: { hash: tx.txID },
        value: BigInt(tx.value.toString()),
      };
    });

    await listOperations(mockAddress, { ...defaultOptions, minHeight: 0 });

    expect(getBlock).toHaveBeenCalledTimes(4);
    expect(getBlock).toHaveBeenCalledWith(0);
    expect(getBlock).toHaveBeenCalledWith(100);
    expect(getBlock).toHaveBeenCalledWith(200);
    expect(getBlock).toHaveBeenCalledWith(300);

    expect(fromTrongridTxInfoToOperation).toHaveBeenCalledTimes(5);
    expect(operationBlocks).toEqual([
      { height: 100, hash: "hash100" },
      { height: 200, hash: "hash200" },
      { height: 100, hash: "hash100" },
      { height: 300, hash: "hash300" },
      { height: 200, hash: "hash200" },
    ]);
  });

  it("should use cached block for minHeight without fetching again", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "tx1", value: new BigNumber(0), blockHeight: 50 },
      { txID: "tx2", value: new BigNumber(10), blockHeight: 100 },
      { txID: "tx3", value: new BigNumber(20), blockHeight: 50 },
    ];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (getBlock as jest.Mock)
      .mockResolvedValueOnce(toBlockResponse(50, "hash50", new Date("2023-01-01T00:50:00Z")))
      .mockResolvedValueOnce(toBlockResponse(100, "hash100", new Date("2023-01-01T01:00:00Z")));

    const operationBlocks: Array<{ height: number; hash: string }> = [];
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation((tx, block) => {
      operationBlocks.push({ height: block.height, hash: block.hash });
      return {
        tx: { hash: tx.txID },
        value: BigInt(tx.value.toString()),
      };
    });

    await listOperations(mockAddress, { ...defaultOptions, minHeight: 50 });

    expect(getBlock).toHaveBeenCalledTimes(2);
    expect(getBlock).toHaveBeenCalledWith(50);
    expect(getBlock).toHaveBeenCalledWith(100);

    expect(operationBlocks).toEqual([
      { height: 50, hash: "hash50" },
      { height: 100, hash: "hash100" },
      { height: 50, hash: "hash50" },
    ]);
  });

  it("should fallback to minHeight block when blockHeight is undefined", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "tx1", value: new BigNumber(0), blockHeight: undefined },
      { txID: "tx2", value: new BigNumber(10), blockHeight: 100 },
      { txID: "tx3", value: new BigNumber(20), blockHeight: undefined },
    ];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (getBlock as jest.Mock)
      .mockResolvedValueOnce(toBlockResponse(0, "hash0", mockBlockTime))
      .mockResolvedValueOnce(toBlockResponse(100, "hash100", new Date("2023-01-01T01:00:00Z")));

    const operationBlocks: Array<{ height: number; hash: string }> = [];
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation((tx, block) => {
      operationBlocks.push({ height: block.height, hash: block.hash });
      return {
        tx: { hash: tx.txID },
        value: BigInt(tx.value.toString()),
      };
    });

    await listOperations(mockAddress, { ...defaultOptions, minHeight: 0 });

    expect(getBlock).toHaveBeenCalledTimes(2);
    expect(getBlock).toHaveBeenCalledWith(0);
    expect(getBlock).toHaveBeenCalledWith(100);

    expect(operationBlocks[0].height).toBe(0);
    expect(operationBlocks[1].height).toBe(100);
    expect(operationBlocks[2].height).toBe(0);
  });
});
