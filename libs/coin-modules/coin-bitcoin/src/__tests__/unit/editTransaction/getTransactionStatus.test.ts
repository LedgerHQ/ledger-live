import { ReplacementTransactionUnderpriced } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import {
  validateEditTransaction,
  getEditTransactionStatus,
} from "../../../editTransaction/getTransactionStatus";
import type { Transaction as BtcTransaction, TransactionStatus } from "../../../types";
import { bitcoinPickingStrategy } from "../../../types";

const makeTransaction = (overrides: Partial<BtcTransaction> = {}): BtcTransaction => ({
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "bc1qexample...",
  utxoStrategy: {
    strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
    excludeUTXOs: [],
  },
  rbf: true,
  feePerByte: new BigNumber(1),
  networkInfo: null,
  ...overrides,
});

const makeStatus = (overrides: Partial<TransactionStatus> = {}): TransactionStatus => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(1),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(1),
  txInputs: undefined,
  txOutputs: undefined,
  opReturnData: undefined,
  changeAddress: undefined,
  ...overrides,
});

describe("validateEditTransaction", () => {
  it("returns empty errors and warnings when editType is undefined", () => {
    const transaction: any = { feePerByte: new BigNumber(10) };
    const transactionToUpdate: any = { rbf: true, feePerByte: new BigNumber(5) };

    const result = validateEditTransaction({
      transaction,
      transactionToUpdate,
      editType: undefined,
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });

  it("sets error when original transaction is not replaceable (rbf = false)", () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: false,
      feePerByte: new BigNumber(5),
    });

    const result = validateEditTransaction({
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.warnings).toEqual({});
    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

<<<<<<< HEAD
  it("sets error when new feePerByte is missing (replacement must have a fee)", () => {
=======
  it("returns empty errors and warnings when original or new feePerByte is missing", () => {
>>>>>>> a01d6c054a (fix: tests and all functions)
    const baseTx = makeTransaction({ rbf: true, feePerByte: new BigNumber(5) });
    const baseEdited = makeTransaction({ feePerByte: new BigNumber(10) });

    const result = validateEditTransaction({
      transaction: { ...baseEdited, feePerByte: undefined },
      transactionToUpdate: baseTx,
      editType: "speedup",
    });

    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("returns empty errors when only original feePerByte is missing and no replaceTxId", () => {
    const baseTx = makeTransaction({ rbf: true, feePerByte: new BigNumber(5) });
    const baseEdited = makeTransaction({ feePerByte: new BigNumber(10) });

    const result = validateEditTransaction({
      transaction: baseEdited,
      transactionToUpdate: { ...baseTx, feePerByte: undefined },
      editType: "speedup",
    });

    expect(result.errors).toEqual({});
  });

  it("returns empty errors when replaceTxId is set but original fee is not yet available (loading)", () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(11) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: undefined as unknown as typeof transaction.feePerByte,
      replaceTxId: "orig-txid",
    });

    const result = validateEditTransaction({
      transaction,
      transactionToUpdate,
      editType: "cancel",
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });

  it("sets error when transactionToUpdate.feePerByte is missing", () => {
    const transaction = makeTransaction({ feePerByte: new BigNumber(11) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: null as unknown as typeof transaction.feePerByte,
      replaceTxId: "orig-txid",
    });

    const result = validateEditTransaction({
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("sets error when new feePerByte is less than minimum required (RBF bump rule)", () => {
    // getMinFees rule of thumb: >= +10% and >= +1 sat/vB, ceil.
    // Original 10 => min is ceil(max(11, 11)) = 11.
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: new BigNumber(10),
    });

    const result = validateEditTransaction({
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.warnings).toEqual({});
    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

<<<<<<< HEAD
  it("returns errors when new feePerByte meets or exceeds minimum required (RBF bump rule)", () => {
    // Original 10 => min is 11. New 12 is OK.
    const transaction = makeTransaction({ feePerByte: new BigNumber(12) });
=======
  it("returns no errors when new feePerByte meets or exceeds minimum required (RBF bump rule)", () => {
    // Original 10 => min is 11. New 11 is OK.
    const transaction = makeTransaction({ feePerByte: new BigNumber(11) });
>>>>>>> a01d6c054a (fix: tests and all functions)
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: new BigNumber(10),
    });

    const result = validateEditTransaction({
      transaction,
      transactionToUpdate,
      editType: "speedup",
    });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });
});

describe("getEditTransactionStatus", () => {
<<<<<<< HEAD
  it("merges edit transaction errors into existing status errors", async () => {
=======
  it("merges edit transaction errors into existing status errors", () => {
>>>>>>> a01d6c054a (fix: tests and all functions)
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: false,
      feePerByte: new BigNumber(5),
    });

    const baseStatus = makeStatus({
      errors: { existingError: new Error("existing") },
    });

    const result = await getEditTransactionStatus({
      transaction,
      transactionToUpdate,
      status: baseStatus,
      editType: "speedup",
    });

    expect(result.estimatedFees).toEqual(baseStatus.estimatedFees);
    expect(result.errors.existingError).toBe(baseStatus.errors.existingError);
    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

<<<<<<< HEAD
  it("keeps original errors when validateEditTransaction returns no errors", async () => {
=======
  it("keeps original errors when validateEditTransaction returns no errors", () => {
>>>>>>> a01d6c054a (fix: tests and all functions)
    const transaction = makeTransaction({ feePerByte: new BigNumber(10) });
    const transactionToUpdate = makeTransaction({
      rbf: true,
      feePerByte: new BigNumber(5),
    });

    const baseStatus = makeStatus({
      errors: { existingError: new Error("existing") },
    });

    const result = await getEditTransactionStatus({
      transaction,
      transactionToUpdate,
      status: baseStatus,
      editType: undefined,
    });

    expect(result.errors).toEqual(baseStatus.errors);
  });
});
