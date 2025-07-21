import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { getAddress } from "./bridgeHelpers/addresses";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { createMockAccount, createMockTransaction, TEST_TRANSFER_IDS } from "../test/fixtures";

// Mock dependencies
jest.mock("./bridgeHelpers/addresses", () => ({
  getAddress: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  encodeOperationId: jest.fn(),
}));

describe("buildOptimisticOperation", () => {
  // Create test fixtures using helper functions
  const mockAccount = createMockAccount();
  const mockTransaction = createMockTransaction();

  const mockHash = "mockedTransactionHash";
  const mockAddress = "01abcdef1234567890";
  const mockOperationId = "mockOperationId";

  beforeEach(() => {
    jest.clearAllMocks();
    (getAddress as jest.Mock).mockReturnValue({ address: mockAddress });
    (encodeOperationId as jest.Mock).mockReturnValue(mockOperationId);
  });

  test("should build an optimistic operation for an outgoing transaction", () => {
    const operation = buildOptimisticOperation(mockAccount, mockTransaction, mockHash);

    expect(getAddress).toHaveBeenCalledWith(mockAccount);
    expect(encodeOperationId).toHaveBeenCalledWith(mockAccount.id, mockHash, "OUT");

    expect(operation).toEqual({
      id: mockOperationId,
      hash: mockHash,
      type: "OUT",
      senders: [mockAddress],
      recipients: [mockTransaction.recipient],
      accountId: mockAccount.id,
      value: mockTransaction.amount.plus(mockTransaction.fees),
      fee: mockTransaction.fees,
      blockHash: null,
      blockHeight: null,
      date: expect.any(Date),
      extra: {
        transferId: mockTransaction.transferId,
      },
      nftOperations: [],
      subOperations: [],
    });
  });

  test("should build an optimistic operation with a custom operation type", () => {
    const customType = "IN";
    const operation = buildOptimisticOperation(mockAccount, mockTransaction, mockHash, customType);

    expect(encodeOperationId).toHaveBeenCalledWith(mockAccount.id, mockHash, customType);
    expect(operation.type).toBe(customType);
  });

  test("should include transferId in the extra field when present", () => {
    const txWithTransferId = {
      ...mockTransaction,
      transferId: TEST_TRANSFER_IDS.VALID,
    };

    const operation = buildOptimisticOperation(mockAccount, txWithTransferId, mockHash);

    expect(operation.extra).toEqual({
      transferId: TEST_TRANSFER_IDS.VALID,
    });
  });

  test("should handle transaction without transferId", () => {
    const txWithoutTransferId = {
      ...mockTransaction,
      transferId: undefined,
    };

    const operation = buildOptimisticOperation(mockAccount, txWithoutTransferId, mockHash);

    expect(operation.extra).toEqual({
      transferId: undefined,
    });
  });
});
