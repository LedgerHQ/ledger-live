import BigNumber from "bignumber.js";
import { fetchTronAccountTxs, getBlock } from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TrongridTxInfo, TronAsset } from "../types";
import { listOperations } from "./listOperations";
import type { Operation } from "@ledgerhq/coin-framework/api/index";
import { get } from "lodash";

// Mock the fetchTronAccountTxs and fromTrongridTxInfoToOperation functions
jest.mock("../network", () => ({
  fetchTronAccountTxs: jest.fn(),
  getBlock: jest.fn(),
}));

jest.mock("../network/trongrid/trongrid-adapters", () => ({
  fromTrongridTxInfoToOperation: jest.fn(),
}));

describe("listOperations", () => {
  const mockAddress = "tronExampleAddress";

  beforeEach(() => {
    jest.clearAllMocks();
    (getBlock as jest.Mock).mockResolvedValue({
      time: new Date("2023-01-01T00:00:00Z"),
    });
  });

  it("should fetch transactions and return operations", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "tx1", value: new BigNumber(0) },
      { txID: "tx2", value: new BigNumber(42) },
    ];

    const expectedOperations: Partial<Operation<TronAsset>>[] = [
      { tx: { hash: "tx1" } as Partial<Operation<TronAsset>>["tx"], value: BigInt(0) },
      { tx: { hash: "tx2" } as Partial<Operation<TronAsset>>["tx"], value: BigInt(42) },
    ];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => {
      return {
        tx: { hash: tx.txID },
        value: BigInt(tx.value.toString()),
      };
    });

    const [operations, token] = await listOperations(mockAddress, 0);

    expect(fetchTronAccountTxs).toHaveBeenCalledWith(mockAddress, expect.any(Function), {});
    expect(fromTrongridTxInfoToOperation).toHaveBeenCalledTimes(mockTxs.length);
    expect(operations).toEqual(expectedOperations);
    expect(token).toBe("");
  });

  it("should filter transactions based on minHeight", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "tx1", blockHeight: 1, value: new BigNumber(0) },
      { txID: "tx2", blockHeight: 2, value: new BigNumber(42) },
    ];
    const expectedOperations: Partial<Operation<TronAsset>>[] = [
      { tx: { hash: "tx2" } as Partial<Operation<TronAsset>>["tx"], value: BigInt(42) },
    ];
    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => {
      return {
        tx: { hash: tx.txID },
        value: BigInt(tx.value.toString()),
      };
    });

    const minHeight = 2;
    const [operations, token] = await listOperations(mockAddress, minHeight);
    expect(fetchTronAccountTxs).toHaveBeenCalledWith(mockAddress, expect.any(Function), {});
    expect(fromTrongridTxInfoToOperation).toHaveBeenCalledTimes(expectedOperations.length);
    expect(operations).toEqual(expectedOperations);
    expect(token).toBe("");
  });

  it("should handle empty transactions", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [];
    const expectedOperations: Partial<Operation<TronAsset>>[] = [];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(() => null);

    const [operations, token] = await listOperations(mockAddress, 0);

    expect(fetchTronAccountTxs).toHaveBeenCalledWith(mockAddress, expect.any(Function), {});
    expect(operations).toEqual(expectedOperations);
    expect(token).toBe("");
  });

  it("should handle errors from fetchTronAccountTxs", async () => {
    const exampleError = new Error("Network error!");
    (fetchTronAccountTxs as jest.Mock).mockRejectedValue(exampleError);

    await expect(listOperations(mockAddress, 0)).rejects.toThrow(new Error(exampleError.message));
  });
});
