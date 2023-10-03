import { NotEnoughNftOwned, NotOwnedNft } from "@ledgerhq/coin-evm/errors";
import type { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import { AmountRequired, ReplacementTransactionUnderpriced } from "@ledgerhq/errors";
import type { TransactionStatusCommon } from "@ledgerhq/types-live";
import type { EditType } from "./types";
import { getMinEip1559Fees, getMinLegacyFees } from "./getMinFees";

type ValidatedTransactionFields = "replacementTransactionUnderpriced";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

/**
 * Validate an edited transaction and returns related errors and warnings
 * Makes sure the updated fees are at least 10% higher than the original fees
 * 10% isn't defined in the protocol, it's just how most nodes & miners implement it
 * If the new transaction fees are less than 10% higher than the original fees,
 * the transaction will be rejected by the network with a
 * "replacement transaction underpriced" error
 */
const validateEditTransaction = ({
  editType,
  transaction,
  transactionToUpdate,
}: {
  transaction: Transaction;
  transactionToUpdate: Transaction;
  editType?: EditType;
}): {
  errors: TransactionStatusCommon["errors"];
  warnings: TransactionStatusCommon["warnings"];
} => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  if (!editType) {
    return {
      errors: {},
      warnings: {},
    };
  }

  const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = transactionToUpdate;
  const {
    maxFeePerGas: newMaxFeePerGas,
    maxPriorityFeePerGas: newMaxPriorityFeePerGas,
    gasPrice: newGasPrice,
  } = transaction;

  if (transaction.type === 2) {
    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      throw new Error("maxFeePerGas and maxPriorityFeePerGas are required");
    }

    if (!newMaxFeePerGas || !newMaxPriorityFeePerGas) {
      // This should already be handled in getTransactionStatus
      return {
        errors: {},
        warnings: {},
      };
    }

    const { maxFeePerGas: minNewMaxFeePerGas, maxPriorityFeePerGas: minNewMaxPriorityFeePerGas } =
      getMinEip1559Fees({ maxFeePerGas, maxPriorityFeePerGas });

    if (
      newMaxFeePerGas.isLessThan(minNewMaxFeePerGas) ||
      newMaxPriorityFeePerGas.isLessThan(minNewMaxPriorityFeePerGas)
    ) {
      errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();

      return {
        errors,
        warnings,
      };
    }
  } else {
    if (!gasPrice) {
      throw new Error("gasPrice is required");
    }

    if (!newGasPrice) {
      // This should already be handled in getTransactionStatus
      return {
        errors: {},
        warnings: {},
      };
    }

    const { gasPrice: minNewGasPrice } = getMinLegacyFees({ gasPrice });

    if (newGasPrice.isLessThan(minNewGasPrice)) {
      errors.replacementTransactionUnderpriced = new ReplacementTransactionUnderpriced();

      return {
        errors,
        warnings,
      };
    }
  }

  return {
    errors: {},
    warnings: {},
  };
};

const ERROR_NOT_ENOUGH_NFT_OWNED = new NotEnoughNftOwned();
const ERROR_NOT_OWNED_NFT = new NotOwnedNft();
const ERROR_AMOUNT_REQUIRED = new AmountRequired();

// NOTE: this logic should ideally be done in getTransactionStatus if possible
// (not sure it is)
export const getEditTransactionStatus = ({
  transaction,
  transactionToUpdate,
  status,
  editType,
}: {
  transaction: Transaction;
  transactionToUpdate: Transaction;
  status: TransactionStatus;
  editType?: EditType;
}): TransactionStatus => {
  const { errors: editTxErrors } = validateEditTransaction({
    editType,
    transaction,
    transactionToUpdate,
  });

  const errors: Record<string, Error> = { ...status.errors, ...editTxErrors };

  // copy errors object to avoid mutating the original one
  const updatedErrors: Record<string, Error> = { ...errors };

  // discard "AmountRequired" (for cancel and speedup since one can decide to speedup a cancel)
  // exclude "NotOwnedNft" and "NotEnoughNftOwned" error if it's a nft operation
  // since nfts being sent are not owned by the user anymore (removed from the account)
  // cf. this (as of 14-09-2023) https://github.com/LedgerHQ/ledger-live/blob/73217c9aa93c901d9c8d2067dcc7090243d35d35/libs/coin-evm/src/synchronization.ts#L111-L120
  if (
    updatedErrors.amount &&
    (updatedErrors.amount.name === ERROR_NOT_OWNED_NFT.name ||
      updatedErrors.amount.name === ERROR_NOT_ENOUGH_NFT_OWNED.name ||
      updatedErrors.amount.name === ERROR_AMOUNT_REQUIRED.name)
  ) {
    delete updatedErrors.amount;
  }

  const updatedStatus: TransactionStatus = {
    ...status,
    errors: updatedErrors,
  };

  return updatedStatus;
};
