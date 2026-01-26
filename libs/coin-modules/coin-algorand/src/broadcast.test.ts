import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcast } from "./broadcast";
import * as network from "./network";

jest.mock("./network");
jest.mock("@ledgerhq/coin-framework/operation", () => ({
  patchOperationWithHash: jest.fn((op, hash) => ({ ...op, hash })),
}));

const mockBroadcastTransaction = network.broadcastTransaction as jest.MockedFunction<
  typeof network.broadcastTransaction
>;

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast signed transaction and return patched operation", async () => {
    const txHash = "TX_HASH_123456";
    mockBroadcastTransaction.mockResolvedValue(txHash);

    const operation: Operation = {
      id: "op-1",
      hash: "",
      type: "OUT",
      value: BigInt(1000000),
      fee: BigInt(1000),
      senders: ["SENDER"],
      recipients: ["RECIPIENT"],
      accountId: "account-1",
      date: new Date(),
      blockHash: null,
      blockHeight: null,
      extra: {},
    };

    const signedOperation: SignedOperation = {
      operation,
      signature: "abcdef123456",
    };

    const result = await broadcast({ signedOperation, account: {} as never });

    expect(result.hash).toBe(txHash);
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(Buffer.from("abcdef123456", "hex"));
  });

  it("should convert hex signature to buffer before broadcasting", async () => {
    mockBroadcastTransaction.mockResolvedValue("TX_HASH");

    const signedOperation: SignedOperation = {
      operation: {
        id: "op-2",
        hash: "",
        type: "OUT",
        value: BigInt(500000),
        fee: BigInt(1000),
        senders: ["SENDER"],
        recipients: ["RECIPIENT"],
        accountId: "account-2",
        date: new Date(),
        blockHash: null,
        blockHeight: null,
        extra: {},
      },
      signature: "48656c6c6f", // "Hello" in hex
    };

    await broadcast({ signedOperation, account: {} as never });

    const expectedBuffer = Buffer.from("48656c6c6f", "hex");
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(expectedBuffer);
  });

  it("should propagate network errors", async () => {
    mockBroadcastTransaction.mockRejectedValue(new Error("Broadcast failed"));

    const signedOperation: SignedOperation = {
      operation: {
        id: "op-3",
        hash: "",
        type: "OUT",
        value: BigInt(100),
        fee: BigInt(1000),
        senders: ["S"],
        recipients: ["R"],
        accountId: "a",
        date: new Date(),
        blockHash: null,
        blockHeight: null,
        extra: {},
      },
      signature: "aabb",
    };

    await expect(broadcast({ signedOperation, account: {} as never })).rejects.toThrow(
      "Broadcast failed",
    );
  });

  it("should patch operation with returned hash", async () => {
    const uniqueHash = "UNIQUE_TX_HASH_789";
    mockBroadcastTransaction.mockResolvedValue(uniqueHash);

    const signedOperation: SignedOperation = {
      operation: {
        id: "op-4",
        hash: "",
        type: "IN",
        value: BigInt(2000000),
        fee: BigInt(2000),
        senders: ["SENDER_ADDR"],
        recipients: ["RECIPIENT_ADDR"],
        accountId: "account-4",
        date: new Date(),
        blockHash: null,
        blockHeight: null,
        extra: {},
      },
      signature: "deadbeef",
    };

    const result = await broadcast({ signedOperation, account: {} as never });

    expect(result.hash).toBe(uniqueHash);
  });
});
