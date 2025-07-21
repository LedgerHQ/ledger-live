import { Transaction as CasperTransaction, PublicKey } from "casper-js-sdk";
import { broadcast } from "./broadcast";
import { broadcastTx } from "../api";
import {
  createMockAccount,
  createMockTransaction,
  createMockSignedOperation,
} from "../test/fixtures";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/lib/operation";

// Mock the dependencies
jest.mock("casper-js-sdk", () => {
  return {
    Transaction: {
      fromJSON: jest.fn().mockReturnValue({
        setSignature: jest.fn(),
      }),
    },
    PublicKey: {
      fromHex: jest.fn().mockReturnValue("mockedPublicKey"),
    },
  };
});

jest.mock("../api", () => ({
  broadcastTx: jest.fn().mockResolvedValue("mockedTxHash"),
}));

describe("broadcast", () => {
  // Create test fixtures
  const mockAccount = createMockAccount();
  const mockTransaction = createMockTransaction();
  const mockSignedOperation = createMockSignedOperation(mockAccount, mockTransaction, {
    signature: "deadbeef",
    rawTxJson: { hash: "mockTxHash" },
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully broadcast a transaction", async () => {
    const result = await broadcast({
      account: mockAccount,
      signedOperation: mockSignedOperation,
    });

    // Assert the transaction was constructed and signed correctly
    expect(CasperTransaction.fromJSON).toHaveBeenCalledWith(mockSignedOperation.rawData.tx);
    expect(PublicKey.fromHex).toHaveBeenCalledWith(mockAccount.freshAddress);

    // Assert the transaction was broadcast
    expect(broadcastTx).toHaveBeenCalled();

    // Assert the operation was patched with the hash
    expect(result.hash).toBe("mockedTxHash");
    expect(result).toEqual({
      ...patchOperationWithHash(mockSignedOperation.operation, "mockedTxHash"),
      hash: "mockedTxHash",
    });
  });

  test("should throw if rawData is missing", async () => {
    // Create a type-safe but invalid signed operation for testing
    const invalidSignedOperation = {
      ...mockSignedOperation,
      rawData: null as any, // Force type assertion for test
    };

    await expect(
      broadcast({
        account: mockAccount,
        signedOperation: invalidSignedOperation,
      }),
    ).rejects.toThrow("casper: rawData is required");
  });

  test("should throw if broadcast fails to return a hash", async () => {
    // Mock broadcastTx to return null (failed broadcast)
    (broadcastTx as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      broadcast({
        account: mockAccount,
        signedOperation: mockSignedOperation,
      }),
    ).rejects.toThrow("casper: failed to broadcast transaction and get transaction hash");
  });
});
