import { ReplacementTransactionUnderpriced } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import {
  validateEditTransaction,
  getEditTransactionStatus,
} from "../../../editTransaction/getTransactionStatus";

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
    const transaction = { feePerByte: new BigNumber(10) };
    const transactionToUpdate = { rbf: false, feePerByte: new BigNumber(5) };

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

  it("returns empty errors and warnings when original or new feePerByte is missing", () => {
    const baseTx = { rbf: true, feePerByte: new BigNumber(5) };
    const baseEdited = { feePerByte: new BigNumber(10) };

    const cases = [
      {
        transaction: { ...baseEdited, feePerByte: undefined },
        transactionToUpdate: baseTx,
      },
      {
        transaction: baseEdited,
        transactionToUpdate: { ...baseTx, feePerByte: undefined },
      },
    ];

    for (const { transaction, transactionToUpdate } of cases) {
      const result = validateEditTransaction({
        transaction,
        transactionToUpdate,
        editType: "speedup",
      });

      expect(result.errors).toEqual({});
      expect(result.warnings).toEqual({});
    }
  });

  it("sets error when new feePerByte is less than minimum required (RBF bump rule)", () => {
    // getMinFees rule of thumb: >= +10% and >= +1 sat/vB, ceil.
    // Original 10 => min is ceil(max(11, 11)) = 11.
    const transaction = { feePerByte: new BigNumber(10) };
    const transactionToUpdate = { rbf: true, feePerByte: new BigNumber(10) };

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

  it("returns no errors when new feePerByte meets or exceeds minimum required (RBF bump rule)", () => {
    // Original 10 => min is 11. New 11 is OK.
    const transaction = { feePerByte: new BigNumber(11) };
    const transactionToUpdate = { rbf: true, feePerByte: new BigNumber(10) };

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
  it("merges edit transaction errors into existing status errors", () => {
    const transaction = { feePerByte: new BigNumber(10) };
    const transactionToUpdate = { rbf: false, feePerByte: new BigNumber(5) };

    const baseStatus = {
      errors: { existingError: new Error("existing") },
      warnings: {},
      someOtherField: "value",
    };

    const result = getEditTransactionStatus({
      transaction,
      transactionToUpdate,
      status: baseStatus,
      editType: "speedup",
    });

    expect(result.someOtherField).toBe("value");
    expect(result.errors.existingError).toBe(baseStatus.errors.existingError);
    expect(result.errors.replacementTransactionUnderpriced).toBeInstanceOf(
      ReplacementTransactionUnderpriced,
    );
  });

  it("keeps original errors when validateEditTransaction returns no errors", () => {
    const transaction = { feePerByte: new BigNumber(10) };
    const transactionToUpdate = { rbf: true, feePerByte: new BigNumber(5) };

    const baseStatus = {
      errors: { existingError: new Error("existing") },
      warnings: {},
    };

    const result = getEditTransactionStatus({
      transaction,
      transactionToUpdate,
      status: baseStatus,
      editType: undefined,
    });

    expect(result.errors).toEqual(baseStatus.errors);
  });
});
