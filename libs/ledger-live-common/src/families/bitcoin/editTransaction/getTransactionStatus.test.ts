jest.mock("../coinConfig", () => ({ getBitcoinCoinConfig: jest.fn(() => ({})) }));

import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { AmountRequired, NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { ReplacementTransactionUnderpriced } from "../../../errors";
import type { JsonSafeRecord } from "../../../bridge/generic-coin-framework/types";
import { validateEditTransaction, getEditTransactionStatus } from "./getTransactionStatus";
import {
  bitcoinPickingStrategy,
  type BitcoinFamilySpecificData,
  type BitcoinFeeParametersJson,
  type EditType,
  type Transaction as BtcTransaction,
  type TransactionStatus,
} from "../types";

// the replacement bump ratio is read from the coin config of the account's currency
const mainAccount = { currency: { id: "bitcoin" } } as Account;

/**
 * A bitcoin transaction whose user choices are `familySpecificData` (the custom rate as a string);
 * `null` for none at all.
 */
const makeTransaction = (
  familySpecificData: BitcoinFamilySpecificData | null = {},
  feeParameters?: BitcoinFeeParametersJson,
): BtcTransaction => ({
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "bc1qexample...",
  ...(familySpecificData
    ? {
        familySpecificData: {
          utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
          rbf: true,
          feePerByte: "1",
          ...familySpecificData,
        },
      }
    : {}),
  ...(feeParameters ? { feeParameters: feeParameters as JsonSafeRecord } : {}),
});

/** Without a fee rate at all: neither a custom one nor an estimated one. */
const withoutFeePerByte = (familySpecificData: BitcoinFamilySpecificData = {}): BtcTransaction => {
  const transaction = makeTransaction(familySpecificData);
  const { feePerByte: _, ...rest } = transaction.familySpecificData ?? {};
  return { ...transaction, familySpecificData: rest };
};

const makeStatus = (overrides: Partial<TransactionStatus> = {}): TransactionStatus => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(1),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(1),
  ...overrides,
});

const expectUnderpriced = (errors: Record<string, Error>) =>
  expect(errors.replacementTransactionUnderpriced).toBeInstanceOf(
    ReplacementTransactionUnderpriced,
  );

describe("validateEditTransaction", () => {
  it("returns empty errors and warnings when editType is undefined", () => {
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: makeTransaction({ rbf: false, feePerByte: "5" }),
      editType: undefined as unknown as EditType,
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });

  it("sets error when original transaction is not replaceable (rbf = false)", () => {
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: makeTransaction({ rbf: false, feePerByte: "5" }),
      editType: "speedup",
    });

    expect(result.warnings).toEqual({});
    expectUnderpriced(result.errors);
  });

  it("sets error when original transaction carries no familySpecificData (rbf unknown)", () => {
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: makeTransaction(null),
      editType: "speedup",
    });

    expectUnderpriced(result.errors);
  });

  it("ignores a top-level rbf flag (legacy transaction shape)", () => {
    const transactionToUpdate = {
      ...makeTransaction(null),
      rbf: true,
      feePerByte: new BigNumber(5),
    } as unknown as BtcTransaction;

    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate,
      editType: "speedup",
    });

    expectUnderpriced(result.errors);
  });

  it("sets error when new feePerByte is missing (replacement must have a fee)", () => {
    const result = validateEditTransaction({
      mainAccount,
      transaction: withoutFeePerByte(),
      transactionToUpdate: makeTransaction({ feePerByte: "5" }),
      editType: "speedup",
    });

    expectUnderpriced(result.errors);
  });

  it.each(["0", "", "not-a-number"])(
    "sets error when new feePerByte is %p (no usable rate)",
    feePerByte => {
      const result = validateEditTransaction({
        mainAccount,
        transaction: makeTransaction({ feePerByte }),
        transactionToUpdate: makeTransaction({ feePerByte: "5" }),
        editType: "speedup",
      });

      expectUnderpriced(result.errors);
    },
  );

  it("returns empty errors when only original feePerByte is missing and no replaceTxId", () => {
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: withoutFeePerByte(),
      editType: "speedup",
    });

    expect(result.errors).toEqual({});
  });

  it("sets error when replaceTxId is set and the original rate is neither stored nor provided", () => {
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "11" }),
      transactionToUpdate: withoutFeePerByte({ replaceTxId: "orig-txid" }),
      editType: "cancel",
    });

    expect(result.warnings).toEqual({});
    expectUnderpriced(result.errors);
  });

  it("sets error when replaceTxId is set and the provided original rate is null", () => {
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "11" }),
      transactionToUpdate: withoutFeePerByte({ replaceTxId: "orig-txid" }),
      editType: "speedup",
      originalFeePerByte: null,
    });

    expectUnderpriced(result.errors);
  });

  it("validates against the provided original rate when the transaction to update has none", () => {
    const transactionToUpdate = withoutFeePerByte({ replaceTxId: "orig-txid" });

    expect(
      validateEditTransaction({
        mainAccount,
        transaction: makeTransaction({ feePerByte: "12" }),
        transactionToUpdate,
        editType: "speedup",
        originalFeePerByte: new BigNumber(10),
      }).errors,
    ).toEqual({});

    expectUnderpriced(
      validateEditTransaction({
        mainAccount,
        transaction: makeTransaction({ feePerByte: "10" }),
        transactionToUpdate,
        editType: "speedup",
        originalFeePerByte: new BigNumber(10),
      }).errors,
    );
  });

  it("prefers the rate stored in the transaction to update over the provided one", () => {
    // stored 10 → min 11: 5 is underpriced even though it beats the provided 2
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "5" }),
      transactionToUpdate: makeTransaction({ feePerByte: "10", replaceTxId: "orig-txid" }),
      editType: "speedup",
      originalFeePerByte: new BigNumber(2),
    });

    expectUnderpriced(result.errors);
  });

  it("reads the estimated rate (feeParameters) before the custom one", () => {
    // estimated 12 beats the original 10, the stale custom 5 does not matter
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "5" }, { feePerByte: "12" }),
      transactionToUpdate: makeTransaction({ feePerByte: "10" }),
      editType: "speedup",
    });

    expect(result.errors).toEqual({});
  });

  it("sets error when new feePerByte is less than minimum required (RBF bump rule)", () => {
    // getMinFees rule of thumb: >= +10% and >= +1 sat/vB, ceil.
    // Original 10 => min is ceil(max(11, 11)) = 11.
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: makeTransaction({ feePerByte: "10" }),
      editType: "speedup",
    });

    expect(result.warnings).toEqual({});
    expectUnderpriced(result.errors);
  });

  it("sets error when new feePerByte does not exceed a fractional original rate", () => {
    // Original 0.5 => min is ceil(max(0.55, 1.5)) = 2; 0.5 is both below the min and not above.
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "0.5" }),
      transactionToUpdate: makeTransaction({ feePerByte: "0.5" }),
      editType: "speedup",
    });

    expectUnderpriced(result.errors);
  });

  it("returns empty errors when new feePerByte meets or exceeds minimum required (RBF bump rule)", () => {
    // Original 10 => min is 11. New 12 is OK.
    const result = validateEditTransaction({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "12" }),
      transactionToUpdate: makeTransaction({ feePerByte: "10" }),
      editType: "speedup",
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });
});

describe("getEditTransactionStatus", () => {
  it("merges edit transaction errors into existing status errors", () => {
    const baseStatus = makeStatus({
      errors: { existingError: new Error("existing") },
    });

    const result = getEditTransactionStatus({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: makeTransaction({ rbf: false, feePerByte: "5" }),
      status: baseStatus,
      editType: "speedup",
    });

    expect(result.estimatedFees).toEqual(baseStatus.estimatedFees);
    expect(result.errors.existingError).toBe(baseStatus.errors.existingError);
    expectUnderpriced(result.errors);
    // the status passed in is not mutated
    expect(baseStatus.errors).not.toHaveProperty("replacementTransactionUnderpriced");
  });

  it("keeps original errors when validateEditTransaction returns no errors", () => {
    const baseStatus = makeStatus({
      errors: { existingError: new Error("existing") },
    });

    const result = getEditTransactionStatus({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: makeTransaction({ feePerByte: "5" }),
      status: baseStatus,
      editType: undefined as unknown as EditType,
    });

    expect(result.errors).toEqual(baseStatus.errors);
  });

  it("validates without an edit type when none is given", () => {
    const result = getEditTransactionStatus({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "10" }),
      transactionToUpdate: makeTransaction({ rbf: false }),
      status: makeStatus(),
    });

    expect(result.errors).toEqual({});
  });

  it("drops the AmountRequired error: a replacement may send nothing", () => {
    const baseStatus = makeStatus({ errors: { amount: new AmountRequired() } });

    const result = getEditTransactionStatus({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "12" }),
      transactionToUpdate: makeTransaction({ feePerByte: "10" }),
      status: baseStatus,
      editType: "cancel",
    });

    expect(result.errors).toEqual({});
    expect(baseStatus.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("keeps any other amount error", () => {
    const amountError = new NotEnoughBalance();

    const result = getEditTransactionStatus({
      mainAccount,
      transaction: makeTransaction({ feePerByte: "12" }),
      transactionToUpdate: makeTransaction({ feePerByte: "10" }),
      status: makeStatus({ errors: { amount: amountError } }),
      editType: "speedup",
    });

    expect(result.errors).toEqual({ amount: amountError });
  });

  it("forwards the original rate fetched for a transaction to update without one", () => {
    const params = {
      mainAccount,
      transaction: makeTransaction({ feePerByte: "12" }),
      transactionToUpdate: withoutFeePerByte({ replaceTxId: "orig-txid" }),
      status: makeStatus(),
      editType: "speedup" as const,
    };

    expectUnderpriced(getEditTransactionStatus(params).errors);
    expect(
      getEditTransactionStatus({
        ...params,
        originalFeePerByte: new BigNumber(10),
      }).errors,
    ).toEqual({});
  });
});
