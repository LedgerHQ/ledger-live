import { Account, BroadcastArg } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcast } from "./broadcast";
import { broadcastTx } from "../network/api";
import { getTxToBroadcast } from "./utils/transactions";
import { StacksOperation } from "../types";

jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../network/api");
jest.mock("./utils/transactions");

describe("broadcast", () => {
  let patchOperationSpy: jest.SpyInstance;
  let broadcastTxSpy: jest.SpyInstance;
  let getTxToBroadcastSpy: jest.SpyInstance;

  const mockOperation = {
    id: "mock-operation-id",
  } as unknown as StacksOperation;

  const mockSignature = "mock-signature";
  const mockTx = { serializedTx: "mock-serialized-tx" };
  const mockHash = "mock-tx-hash";

  beforeEach(() => {
    patchOperationSpy = jest.spyOn({ patchOperationWithHash }, "patchOperationWithHash");
    broadcastTxSpy = jest.spyOn({ broadcastTx }, "broadcastTx");
    getTxToBroadcastSpy = jest.spyOn({ getTxToBroadcast }, "getTxToBroadcast");

    getTxToBroadcastSpy.mockResolvedValue(mockTx);
    broadcastTxSpy.mockResolvedValue(mockHash);
    patchOperationSpy.mockReturnValue({ ...mockOperation, hash: mockHash });
  });

  it("should get tx to broadcast with correct parameters", async () => {
    await broadcast({
      signedOperation: {
        operation: mockOperation,
        signature: mockSignature,
        rawData: { someData: "value" },
      },
    } as unknown as BroadcastArg<Account>);

    expect(getTxToBroadcastSpy).toHaveBeenCalledWith(mockOperation, mockSignature, {
      someData: "value",
    });
  });

  it("should use empty object when rawData is not provided", async () => {
    await broadcast({
      signedOperation: {
        operation: mockOperation,
        signature: mockSignature,
      },
    } as unknown as BroadcastArg<Account>);

    expect(getTxToBroadcastSpy).toHaveBeenCalledWith(mockOperation, mockSignature, {});
  });

  it("should broadcast the transaction", async () => {
    await broadcast({
      signedOperation: {
        operation: mockOperation,
        signature: mockSignature,
      },
    } as unknown as BroadcastArg<Account>);

    expect(broadcastTxSpy).toHaveBeenCalledWith(mockTx);
  });

  it("should patch operation with hash", async () => {
    await broadcast({
      signedOperation: {
        operation: mockOperation,
        signature: mockSignature,
      },
    } as unknown as BroadcastArg<Account>);

    expect(patchOperationSpy).toHaveBeenCalledWith(mockOperation, mockHash);
  });

  it("should return the patched operation", async () => {
    const result = await broadcast({
      signedOperation: {
        operation: mockOperation,
        signature: mockSignature,
      },
    } as unknown as BroadcastArg<Account>);

    expect(result).toEqual({ ...mockOperation, hash: mockHash });
  });

  it("should throw error when operation is not a StacksOperation", async () => {
    await expect(
      broadcast({
        signedOperation: {
          operation: null,
          signature: mockSignature,
        },
      } as unknown as BroadcastArg<Account>),
    ).rejects.toThrow("StacksOperation expected");
  });
});
