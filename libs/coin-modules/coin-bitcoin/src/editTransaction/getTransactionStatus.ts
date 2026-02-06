import { AmountRequired, ReplacementTransactionUnderpriced } from "@ledgerhq/errors";
import type { TransactionStatusCommon } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { getMinFees } from "./getMinEditTransactionFees";
import type { EditType, Transaction as BitcoinTransaction, TransactionStatus } from "../types";

type ValidatedTransactionFields =
  | "recipient"
  | "amount"
  | "changeAddress"
  | "feePerByte"
  | "opReturnSizeLimit"
  | "dustLimit"
  | "sender"
  | "replacementTransactionUnderpriced";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an edited bitcoin transaction (RBF replacement) and returns related errors/warnings.
 * Ensures the updated fee rate is high enough vs. the original tx fee rate.
 * When transactionToUpdate.feePerByte is not available (e.g. not stored in operation), pass
 * originalFeePerByte from getOriginalTxFeeRateSatVb(account, transactionToUpdate.replaceTxId).
 */
export const validateEditTransaction = ({
  transaction,
  transactionToUpdate,
  editType,
  originalFeePerByte: originalFeePerByteParam,
}: {
  transaction: BitcoinTransaction;
  transactionToUpdate: BitcoinTransaction;
  editType?: EditType | undefined;
  /** When transactionToUpdate.feePerByte is null/undefined, use this (e.g. from getOriginalTxFeeRateSatVb). */
  originalFeePerByte?: BigNumber | null | undefined;
}): {
  errors: TransactionStatusCommon["errors"];
  warnings: TransactionStatusCommon["warnings"];
} => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  if (!editType) {
    return { errors: {}, warnings: {} };
  }
  console.log("Transaction to update:", transactionToUpdate);
  console.log("Edited transaction:", transaction);
  // If the original tx is explicitly not replaceable, replacement should be considered invalid.
  if (!transactionToUpdate.rbf) {
    errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();
    return { errors, warnings };
  }

  const originalFeePerByte = transactionToUpdate.feePerByte ?? originalFeePerByteParam ?? null;
  const newFeePerByte = transaction.feePerByte;

  const needsOriginalFee =
    !!transactionToUpdate.replaceTxId && transactionToUpdate.feePerByte === null;

  if (needsOriginalFee && originalFeePerByte === null) {
    errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();
    return { errors, warnings };
  }
  console.log(
    `Original fee per byte: ${originalFeePerByte ? originalFeePerByte.toString() : "null"}, New fee per byte: ${
      newFeePerByte ? newFeePerByte.toString() : "null"
    }`,
  );
  if (!originalFeePerByte) {
    return { errors: {}, warnings: {} };
  }

  if (!newFeePerByte || newFeePerByte.isZero()) {
    errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();
    return { errors, warnings };
  }

  const { feePerByte: minNewFeePerByte } = getMinFees({ feePerByte: originalFeePerByte });
  console.log(`Minimum new fee per byte required: ${minNewFeePerByte.toString()}`);
  if (newFeePerByte.isLessThanOrEqualTo(minNewFeePerByte)) {
    console.log(
      `New fee per byte (${newFeePerByte.toString()}) is too low compared to the original fee per byte (${originalFeePerByte.toString()}). Minimum required fee per byte is ${minNewFeePerByte.toString()}.`,
    );
    errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();
    return { errors, warnings };
  }

  return { errors: {}, warnings: {} };
};

export type GetEditTransactionStatusParams = {
  transaction: BitcoinTransaction;
  transactionToUpdate: BitcoinTransaction;
  status: TransactionStatus;
  editType?: EditType;
  /** When transactionToUpdate.feePerByte is null/undefined, use this (e.g. from getOriginalTxFeeRateSatVb). */
  originalFeePerByte?: BigNumber | null | undefined;
};

const ERROR_AMOUNT_REQUIRED = new AmountRequired();

export const getEditTransactionStatus = ({
  transaction,
  transactionToUpdate,
  status,
  editType,
  originalFeePerByte,
}: GetEditTransactionStatusParams): TransactionStatus => {
  const { errors: editTxErrors } = validateEditTransaction({
    editType,
    transaction,
    transactionToUpdate,
    ...(originalFeePerByte !== null ? { originalFeePerByte } : {}),
  });

  const errors: Record<string, Error> = { ...status.errors, ...editTxErrors };

  // copy errors object to avoid mutating the original one
  const updatedErrors: Record<string, Error> = { ...errors };

  if (updatedErrors.amount && updatedErrors.amount.name === ERROR_AMOUNT_REQUIRED.name) {
    delete updatedErrors.amount;
  }
  console.log("Updated errors after edit transaction validation:", updatedErrors);
  return {
    ...status,
    errors: updatedErrors,
  };
};
