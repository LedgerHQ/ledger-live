import { log } from "@ledgerhq/logs";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import { createMockAccount, createMockTransaction } from "../test/fixtures";
import { CASPER_NETWORK } from "../consts";
import { methodToString } from "../common-logic";
import { TransactionStatus, Transaction } from "../types";
import BigNumber from "bignumber.js";

// Mock the log function to prevent console output during tests
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

/**
 * Tests for the getDeviceTransactionConfig function
 * Validates the correct display fields are generated for Ledger devices
 */
describe("getDeviceTransactionConfig", () => {
  // Common test objects
  const MOCK_AMOUNT = new BigNumber("1000000000"); // 1 CSPR
  const TRANSFER_ID = "12345678";

  /**
   * Creates a mock transaction status for testing
   * @returns A valid TransactionStatus object
   */
  const createMockStatus = (): TransactionStatus => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  });

  /**
   * Helper to get config fields
   */
  const getConfigFields = (transaction: Transaction, account = createMockAccount()) =>
    getDeviceTransactionConfig({
      account,
      parentAccount: null,
      transaction,
      status: createMockStatus(),
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should display chain ID, transaction type and amount fields for standard transactions", () => {
    // Create mock transaction
    const mockTransaction = createMockTransaction({
      amount: MOCK_AMOUNT,
    });

    // Get display fields
    const fields = getConfigFields(mockTransaction);

    // Verify the results
    expect(fields).toHaveLength(4);
    // Check Type field
    expect(fields[0]).toEqual({
      type: "text",
      label: "Type",
      value: methodToString(0), // 0 = "transfer"
    });

    // Check Chain ID field
    expect(fields[1]).toEqual({
      type: "text",
      label: "Chain ID",
      value: CASPER_NETWORK,
    });

    // Check Fee field
    expect(fields[2]).toEqual({
      type: "casper.extendedAmount",
      label: "Fee",
      value: new BigNumber(100000000),
    });

    // Check Amount field
    expect(fields[3]).toEqual({
      type: "casper.extendedAmount",
      label: "Amount",
      value: MOCK_AMOUNT,
    });

    // Verify logging
    expect(log).toHaveBeenCalledWith("debug", expect.stringContaining("Transaction config"));
  });

  test("should include transferId field when provided in transaction", () => {
    // Create mock transaction with transferId
    const mockTransaction = createMockTransaction({
      amount: MOCK_AMOUNT,
      transferId: TRANSFER_ID,
    });

    // Get display fields
    const fields = getConfigFields(mockTransaction);

    // Verify the results
    expect(fields).toHaveLength(5); // Chain ID, Type, Amount, Transfer ID fields

    // Check all fields are present
    const fieldLabels = fields.map(field => field.label);
    expect(fieldLabels).toEqual(["Type", "Chain ID", "Fee", "Amount", "Transfer ID"]);

    // Check Transfer ID field specifically
    expect(fields[4]).toEqual({
      type: "text",
      label: "Transfer ID",
      value: TRANSFER_ID,
    });
  });

  test("should not include transferId field when undefined in transaction", () => {
    // Create mock transaction with explicitly undefined transferId
    const mockTransaction = createMockTransaction({
      amount: MOCK_AMOUNT,
      transferId: undefined,
    });

    // Get display fields
    const fields = getConfigFields(mockTransaction);

    // Verify no transferId field is present
    expect(fields).toHaveLength(4);
    expect(fields.map(field => field.label)).not.toContain("Transfer ID");
  });

  test("should handle zero amount transactions correctly", () => {
    // Create mock transaction with zero amount
    const mockTransaction = createMockTransaction({
      amount: new BigNumber(0),
    });

    // Get display fields
    const fields = getConfigFields(mockTransaction);

    // Verify amount field has zero value
    const amountField = fields.find(field => field.label === "Amount");
    expect(amountField).toBeDefined();
    expect(amountField).toEqual({
      type: "casper.extendedAmount",
      label: "Amount",
      value: new BigNumber(0),
    });
  });

  test("should maintain consistent order of fields regardless of transaction properties", () => {
    // Create two transactions - one with transferId, one without
    const txWithTransferId = createMockTransaction({
      amount: MOCK_AMOUNT,
      transferId: TRANSFER_ID,
    });

    const txWithoutTransferId = createMockTransaction({
      amount: MOCK_AMOUNT,
    });

    const fieldsWithId = getConfigFields(txWithTransferId);
    const fieldsWithoutId = getConfigFields(txWithoutTransferId);

    // Verify field order consistency for common fields
    for (let i = 0; i < fieldsWithoutId.length; i++) {
      expect(fieldsWithId[i].label).toEqual(fieldsWithoutId[i].label);
    }
  });
});
