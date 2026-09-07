import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { CASPER_FEES_MOTES, CASPER_NETWORK } from "./constants";
import { methodToString } from "./logic";
import { createMockAccount } from "./__tests__/fixtures/account.fixture";
import { createMockTransaction } from "./__tests__/fixtures/transaction.fixture";
import { TransactionStatus, Transaction } from "./types";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("getDeviceTransactionConfig", () => {
  const MOCK_AMOUNT = new BigNumber("1000000000");
  const TRANSFER_ID = "12345678";

  const createMockStatus = (): TransactionStatus => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  });

  const getConfigFields = async (transaction: Transaction, account = createMockAccount()) =>
    await getDeviceTransactionConfig({
      account,
      parentAccount: null,
      transaction,
      status: createMockStatus(),
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should display chain ID, transaction type and amount fields for standard transactions", async () => {
    const mockTransaction = createMockTransaction({ amount: MOCK_AMOUNT });
    const fields = await getConfigFields(mockTransaction);

    expect(fields).toHaveLength(4);
    expect(fields[0]).toEqual({ type: "text", label: "Type", value: methodToString(0) });
    expect(fields[1]).toEqual({ type: "text", label: "Chain ID", value: CASPER_NETWORK });
    expect(fields[2]).toEqual({
      type: "casper.extendedAmount",
      label: "Fee",
      value: new BigNumber(100000000),
    });
    expect(fields[3]).toEqual({
      type: "casper.extendedAmount",
      label: "Amount",
      value: MOCK_AMOUNT,
    });
    expect(log).toHaveBeenCalledWith("debug", expect.stringContaining("Transaction config"));
  });

  test("should include transferId field when provided in transaction", async () => {
    const mockTransaction = createMockTransaction({ amount: MOCK_AMOUNT, transferId: TRANSFER_ID });
    const fields = await getConfigFields(mockTransaction);

    expect(fields).toHaveLength(5);
    expect(fields.map(f => f.label)).toEqual(["Type", "Chain ID", "Fee", "Amount", "Transfer ID"]);
    expect(fields[4]).toEqual({ type: "text", label: "Transfer ID", value: TRANSFER_ID });
  });

  test("should not include transferId field when undefined in transaction", async () => {
    const mockTransaction = createMockTransaction({ amount: MOCK_AMOUNT });
    const fields = await getConfigFields(mockTransaction);

    expect(fields).toHaveLength(4);
    expect(fields.map(f => f.label)).not.toContain("Transfer ID");
  });

  test("should handle zero amount transactions correctly", async () => {
    const mockTransaction = createMockTransaction({ amount: new BigNumber(0) });
    const fields = await getConfigFields(mockTransaction);
    const amountField = fields.find(f => f.label === "Amount");

    expect(amountField).toEqual({
      type: "casper.extendedAmount",
      label: "Amount",
      value: new BigNumber(0),
    });
  });

  test("should default fee to estimated fees when fees is null", async () => {
    const tx = {
      ...createMockTransaction({ amount: MOCK_AMOUNT }),
      fees: null,
    };
    const fields = await getConfigFields(tx);

    expect(fields[2]).toEqual({
      type: "casper.extendedAmount",
      label: "Fee",
      value: new BigNumber(CASPER_FEES_MOTES),
    });
  });

  test("should maintain consistent order of fields regardless of transaction properties", async () => {
    const fieldsWithId = await getConfigFields(
      createMockTransaction({ amount: MOCK_AMOUNT, transferId: TRANSFER_ID }),
    );
    const fieldsWithoutId = await getConfigFields(createMockTransaction({ amount: MOCK_AMOUNT }));

    for (let i = 0; i < fieldsWithoutId.length; i++) {
      expect(fieldsWithId[i].label).toEqual(fieldsWithoutId[i].label);
    }
  });
});
