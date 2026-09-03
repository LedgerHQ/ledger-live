import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import BigNumber from "bignumber.js";
import { CASPER_FEES_MOTES } from "../constants";
import { createMockAccount, createMockTransaction, TEST_TRANSFER_IDS } from "../__tests__/fixtures";
import { getAddress } from "../logic/validateAddress";
import type { Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

// Mock dependencies
jest.mock("../logic/validateAddress", () => ({
  getAddress: jest.fn(),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/operation", () => ({
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
      value: mockTransaction.amount.plus(mockTransaction.fees ?? new BigNumber(0)),
      fee: mockTransaction.fees ?? new BigNumber(0),
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
    const { transferId: _t, ...txWithoutTransferId } = mockTransaction;

    const operation = buildOptimisticOperation(
      mockAccount,
      txWithoutTransferId as Transaction,
      mockHash,
    );

    expect(operation.extra).toEqual({});
  });

  test("should default fee to estimated fees when fees is null", () => {
    const txWithoutFees: Transaction = { ...mockTransaction, fees: null };

    const operation = buildOptimisticOperation(mockAccount, txWithoutFees, mockHash);

    expect(operation.fee).toEqual(new BigNumber(CASPER_FEES_MOTES));
    expect(operation.value).toEqual(mockTransaction.amount.plus(CASPER_FEES_MOTES));
  });
});
