import BigNumber from "bignumber.js";
import { fetchTronAccountTxs } from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TrongridTxInfo, TronToken } from "../types";
import { listOperations } from "./listOperations";
import type { Operation } from "@ledgerhq/coin-framework/api/index";

// Mock the fetchTronAccountTxs and fromTrongridTxInfoToOperation functions
jest.mock("../network", () => ({
  fetchTronAccountTxs: jest.fn(),
}));

jest.mock("../network/trongrid/trongrid-adapters", () => ({
  fromTrongridTxInfoToOperation: jest.fn(),
}));

describe("listOperations", () => {
  const mockAddress = "tronExampleAddress";

  it("should fetch transactions and return operations", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "tx1", value: new BigNumber(0) },
      { txID: "tx2", value: new BigNumber(42) },
    ];

    const mockOperations: Partial<Operation<TronToken>>[] = [
      { tx: { hash: "tx1" } as Partial<Operation<TronToken>>["tx"], value: BigInt(0) },
      { tx: { hash: "tx2" } as Partial<Operation<TronToken>>["tx"], value: BigInt(42) },
    ];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => {
      return {
        tx: { hash: tx.txID },
        value: BigInt(tx.value.toString()),
      };
    });

    const [operations, token] = await listOperations(mockAddress);

    expect(fetchTronAccountTxs).toHaveBeenCalledWith(mockAddress, expect.any(Function), {});
    expect(fromTrongridTxInfoToOperation).toHaveBeenCalledTimes(mockTxs.length);
    expect(operations).toEqual(mockOperations);
    expect(token).toBe("");
  });

  it("should handle empty transactions", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [];
    const mockOperations: Partial<Operation<TronToken>>[] = [];

    (fetchTronAccountTxs as jest.Mock).mockResolvedValue(mockTxs);
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(() => null);

    const [operations, token] = await listOperations(mockAddress);

    expect(fetchTronAccountTxs).toHaveBeenCalledWith(mockAddress, expect.any(Function), {});
    expect(operations).toEqual(mockOperations);
    expect(token).toBe("");
  });

  it("should handle errors from fetchTronAccountTxs", async () => {
    const exampleError = new Error("Network error!");
    (fetchTronAccountTxs as jest.Mock).mockRejectedValue(exampleError);

    await expect(listOperations(mockAddress)).rejects.toThrow(new Error(exampleError.message));
  });
});
