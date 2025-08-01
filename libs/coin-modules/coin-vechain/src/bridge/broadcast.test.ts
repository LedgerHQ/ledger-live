import BigNumber from "bignumber.js";
import { broadcast } from "./broadcast";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { submit } from "../network";
import { VechainSDKTransaction } from "../types";
import { Account } from "@ledgerhq/types-live";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../network");
jest.mock("../types", () => ({
  ...jest.requireActual("../types"),
  VechainSDKTransaction: {
    of: jest.fn(),
  },
}));

const mockedPatchOperationWithHash = jest.mocked(patchOperationWithHash);
const mockedSubmit = jest.mocked(submit);
const mockedVechainSDKTransaction = jest.mocked(VechainSDKTransaction);

describe("broadcast", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "vechain:1:0x123:",
    seedIdentifier: "seed123",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
    freshAddressPath: "44'/818'/0'/0/0",
    used: true,
    balance: new BigNumber("5000000000000000000"),
    spendableBalance: new BigNumber("5000000000000000000"),
    creationDate: new Date("2022-01-01"),
    blockHeight: 12345,
    currency: {} as any,
    operationsCount: 10,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2022-01-01"),
    balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
    swapHistory: [],
    subAccounts: [],
  };

  const mockOperation = {
    id: "vechain:1:0x123:0xtxhash:OUT",
    hash: "",
    type: "OUT" as const,
    value: new BigNumber("1000000000000000000"),
    fee: new BigNumber("21000000000000000"),
    blockHash: null,
    blockHeight: null,
    senders: ["0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4"],
    recipients: ["0x456789012345678901234567890123456789abcd"],
    accountId: "vechain:1:0x123:",
    date: new Date("2022-01-01"),
    extra: {},
  };

  const mockTransactionBody = {
    chainTag: 74,
    blockRef: "0x00000000000b2bce",
    expiration: 18,
    clauses: [
      {
        to: "0x456789012345678901234567890123456789abcd",
        value: "1000000000000000000",
        data: "0x",
      },
    ],
    maxFeePerGas: 10000000000000,
    maxPriorityFeePerGas: 1000000000000,
    gas: 21000,
    dependsOn: null,
    nonce: "0x12345678",
  };

  const mockSignedOperation = {
    operation: mockOperation,
    signature: "1234567890abcdef",
    rawData: {
      family: "vechain" as const,
      body: mockTransactionBody,
    },
  };

  const mockTransaction = {
    body: mockTransactionBody,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast a signed transaction successfully", async () => {
    const mockTxHash = "0xabcdef1234567890";
    const mockPatchedOperation = { ...mockOperation, hash: mockTxHash };

    mockedVechainSDKTransaction.of.mockReturnValue(mockTransaction as any);
    mockedSubmit.mockResolvedValue(mockTxHash);
    mockedPatchOperationWithHash.mockReturnValue(mockPatchedOperation);

    const result = await broadcast({ account: mockAccount, signedOperation: mockSignedOperation });

    expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(
      mockTransactionBody,
      Buffer.from("1234567890abcdef", "hex"),
    );
    expect(mockedSubmit).toHaveBeenCalledWith(mockTransaction);
    expect(mockedPatchOperationWithHash).toHaveBeenCalledWith(mockOperation, mockTxHash);
    expect(result).toEqual(mockPatchedOperation);
  });

  it("should handle transaction creation from raw data", async () => {
    const mockTxHash = "0x123456789abcdef0";
    const mockPatchedOperation = { ...mockOperation, hash: mockTxHash };

    mockedVechainSDKTransaction.of.mockReturnValue(mockTransaction as any);
    mockedSubmit.mockResolvedValue(mockTxHash);
    mockedPatchOperationWithHash.mockReturnValue(mockPatchedOperation);

    await broadcast({ account: mockAccount, signedOperation: mockSignedOperation });

    expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(
      mockTransactionBody,
      expect.any(Buffer),
    );
  });

  it("should convert hex signature to Buffer correctly", async () => {
    const hexSignature = "abcdef1234567890";
    const signedOpWithHexSig = {
      ...mockSignedOperation,
      signature: hexSignature,
    };

    mockedVechainSDKTransaction.of.mockReturnValue(mockTransaction as any);
    mockedSubmit.mockResolvedValue("0xhash");
    mockedPatchOperationWithHash.mockReturnValue(mockOperation);

    await broadcast({ account: mockAccount, signedOperation: signedOpWithHexSig });

    expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(
      mockTransactionBody,
      Buffer.from(hexSignature, "hex"),
    );
  });

  it("should propagate errors from submit", async () => {
    const errorMessage = "Network error during submission";
    mockedVechainSDKTransaction.of.mockReturnValue(mockTransaction as any);
    mockedSubmit.mockRejectedValue(new Error(errorMessage));

    await expect(
      broadcast({ account: mockAccount, signedOperation: mockSignedOperation }),
    ).rejects.toThrow(errorMessage);
  });

  it("should propagate errors from VechainSDKTransaction.of", async () => {
    const errorMessage = "Invalid transaction body";
    mockedVechainSDKTransaction.of.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await expect(
      broadcast({ account: mockAccount, signedOperation: mockSignedOperation }),
    ).rejects.toThrow(errorMessage);
  });

  it("should handle different signature formats", async () => {
    const signatures = ["12ab", "1234567890abcdef", "ff".repeat(32)];

    for (const signature of signatures) {
      const signedOp = { ...mockSignedOperation, signature };
      mockedVechainSDKTransaction.of.mockReturnValue(mockTransaction as any);
      mockedSubmit.mockResolvedValue("0xhash");
      mockedPatchOperationWithHash.mockReturnValue(mockOperation);

      await broadcast({ account: mockAccount, signedOperation: signedOp });

      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(
        mockTransactionBody,
        Buffer.from(signature, "hex"),
      );
    }
  });

  it("should handle complex transaction bodies", async () => {
    const complexBody = {
      ...mockTransactionBody,
      clauses: [
        {
          to: "0x456789012345678901234567890123456789abcd",
          value: "1000000000000000000",
          data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d0b251d8c1743ec40000000000000000000000000000000000000000000000000de0b6b3a7640000",
        },
        {
          to: "0x0000000000000000000000000000456e65726779",
          value: "0",
          data: "0x",
        },
      ],
      dependsOn: "0xprevious123",
    };

    const complexSignedOp = {
      ...mockSignedOperation,
      rawData: { ...mockSignedOperation.rawData, body: complexBody },
    };

    mockedVechainSDKTransaction.of.mockReturnValue({ body: complexBody } as any);
    mockedSubmit.mockResolvedValue("0xhash");
    mockedPatchOperationWithHash.mockReturnValue(mockOperation);

    await broadcast({ account: mockAccount, signedOperation: complexSignedOp });

    expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(complexBody, expect.any(Buffer));
  });

  it("should return the exact result from patchOperationWithHash", async () => {
    const specificPatchedOp = {
      ...mockOperation,
      hash: "0xspecifichash",
      blockHeight: 12345,
    };

    mockedVechainSDKTransaction.of.mockReturnValue(mockTransaction as any);
    mockedSubmit.mockResolvedValue("0xspecifichash");
    mockedPatchOperationWithHash.mockReturnValue(specificPatchedOp);

    const result = await broadcast({ account: mockAccount, signedOperation: mockSignedOperation });

    expect(result).toBe(specificPatchedOp);
  });
});
