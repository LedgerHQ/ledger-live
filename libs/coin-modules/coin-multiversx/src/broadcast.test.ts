import { broadcast } from "./broadcast";
import { broadcastTransaction } from "./api";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";

jest.mock("./api", () => ({
  broadcastTransaction: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  patchOperationWithHash: jest.fn(),
}));

describe("broadcast", () => {
  const mockBroadcastTransaction = broadcastTransaction as jest.MockedFunction<
    typeof broadcastTransaction
  >;
  const mockPatchOperationWithHash = patchOperationWithHash as jest.MockedFunction<
    typeof patchOperationWithHash
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("broadcasts signed operation and returns patched operation", async () => {
    const mockHash = "abc123hash";
    const mockOperation = {
      id: "op1",
      hash: "",
      type: "OUT" as const,
      value: BigInt(1000),
      fee: BigInt(50),
      senders: ["sender"],
      recipients: ["recipient"],
      blockHeight: null,
      blockHash: null,
      accountId: "account1",
      date: new Date(),
      extra: {},
    };
    const mockPatchedOperation = { ...mockOperation, hash: mockHash };

    const signedOperation = {
      operation: mockOperation,
      signature: "signature123",
      rawData: { nonce: 1 },
    };

    mockBroadcastTransaction.mockResolvedValue(mockHash);
    mockPatchOperationWithHash.mockReturnValue(mockPatchedOperation as any);

    const result = await broadcast({ signedOperation } as any);

    expect(mockBroadcastTransaction).toHaveBeenCalledWith(signedOperation);
    expect(mockPatchOperationWithHash).toHaveBeenCalledWith(mockOperation, mockHash);
    expect(result).toEqual(mockPatchedOperation);
  });

  it("propagates errors from broadcastTransaction", async () => {
    const mockOperation = {
      id: "op1",
      type: "OUT" as const,
      value: BigInt(1000),
      fee: BigInt(50),
      senders: ["sender"],
      recipients: ["recipient"],
      blockHeight: null,
      blockHash: null,
      accountId: "account1",
      date: new Date(),
      extra: {},
    };

    const signedOperation = {
      operation: mockOperation,
      signature: "signature123",
      rawData: { nonce: 1 },
    };

    mockBroadcastTransaction.mockRejectedValue(new Error("Network error"));

    await expect(broadcast({ signedOperation } as any)).rejects.toThrow("Network error");
  });
});
