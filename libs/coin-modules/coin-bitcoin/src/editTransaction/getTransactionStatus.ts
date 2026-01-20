import { ReplacementTransactionUnderpriced } from "@ledgerhq/errors";
import type { TransactionStatusCommon } from "@ledgerhq/types-live";
import { getMinFees } from "./getMinEditTransactionFees";
import type { EditType, Transaction as BitcoinTransaction, TransactionStatus } from "../types";

type ValidatedTransactionFields = "replacementTransactionUnderpriced";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an edited bitcoin transaction (RBF replacement) and returns related errors/warnings.
 * Ensures the updated fee rate is high enough vs. the original tx fee rate.
 */
export const validateEditTransaction = ({
  transaction,
  transactionToUpdate,
  editType,
}: {
  transaction: BitcoinTransaction;
  transactionToUpdate: BitcoinTransaction;
  editType?: EditType | undefined;
}): {
  errors: TransactionStatusCommon["errors"];
  warnings: TransactionStatusCommon["warnings"];
} => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  if (!editType) {
    return { errors: {}, warnings: {} };
  }

  // If the original tx is explicitly not replaceable, replacement should be considered invalid.
  if (!transactionToUpdate.rbf) {
    errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();
    return { errors, warnings };
  }

  const originalFeePerByte = transactionToUpdate.feePerByte;
  const newFeePerByte = transaction.feePerByte;

  if (!originalFeePerByte || !newFeePerByte) {
    return { errors: {}, warnings: {} };
  }

  const { feePerByte: minNewFeePerByte } = getMinFees({ feePerByte: originalFeePerByte });

  if (newFeePerByte.isLessThan(minNewFeePerByte)) {
    errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();
    return { errors, warnings };
  }

  return { errors: {}, warnings: {} };
};

export const getEditTransactionStatus = ({
  transaction,
  transactionToUpdate,
  status,
  editType,
}: {
  transaction: BitcoinTransaction;
  transactionToUpdate: BitcoinTransaction;
  status: TransactionStatus;
  editType?: EditType;
}): TransactionStatus => {
  const { errors: editTxErrors } = validateEditTransaction({
    editType,
    transaction,
    transactionToUpdate,
  });

  return {
    ...status,
    errors: { ...status.errors, ...editTxErrors },
  };
};
