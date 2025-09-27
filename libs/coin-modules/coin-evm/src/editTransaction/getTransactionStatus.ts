import {
  AmountRequired,
  ETHAddressNonEIP,
  InvalidAddress,
  RecipientRequired,
  ReplacementTransactionUnderpriced,
} from "@ledgerhq/errors";
import { ethers } from "ethers";
import { Account, TransactionStatusCommon } from "@ledgerhq/types-live";
import { getMinEip1559Fees, getMinLegacyFees } from "../editTransaction/getMinEditTransactionFees";
import { NotEnoughNftOwned, NotOwnedNft } from "../errors";
import { EditType, Transaction as EvmTransaction, TransactionStatus } from "../types";

type ValidatedTransactionFields =
  | "recipient"
  | "gasLimit"
  | "gasPrice"
  | "amount"
  | "maxPriorityFee"
  | "maxFee"
  | "feeTooHigh"
  | "replacementTransactionUnderpriced";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

// This regex will not work with Starknet since addresses are 65 caracters long after the 0x
const ethAddressRegEx = /^(0x)?[0-9a-fA-F]{40}$/;

/**
 * Validate an address for a transaction
 */
export const validateRecipient = (
  account: Account,
  tx: EvmTransaction,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  if (tx.recipient) {
    // Check if recipient is matching the format of a valid eth address or not
    const isRecipientMatchingEthFormat = tx.recipient.match(ethAddressRegEx);

    if (!isRecipientMatchingEthFormat) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    } else {
      // Check if address is respecting EIP-55
      try {
        const recipientChecksumed = ethers.getAddress(tx.recipient);
        if (tx.recipient !== recipientChecksumed) {
          // this case can happen if the user is entering an ICAP address.
          throw new Error();
        }
      } catch (e) {
        // either getAddress throws for a bad checksum or we throw manually if the recipient isn't the same.
        warnings.recipient = new ETHAddressNonEIP(); // "Auto-verification not available: carefully verify the address"
      }
    }
  } else {
    errors.recipient = new RecipientRequired(); // ""
  }

  return [errors, warnings];
};

/**
 * Validate an edited transaction and returns related errors and warnings
 * Makes sure the updated fees are at least 10% higher than the original fees
 * 10% isn't defined in the protocol, it's just how most nodes & miners implement it
 * If the new transaction fees are less than 10% higher than the original fees,
 * the transaction will be rejected by the network with a
 * "replacement transaction underpriced" error
 */
export const validateEditTransaction = ({
  transaction,
  transactionToUpdate,
  editType,
}: {
  transaction: EvmTransaction;
  transactionToUpdate: EvmTransaction;
  editType?: EditType | undefined;
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

/**
 * This function is used to update the status of an edited transaction
 */
export const getEditTransactionStatus = ({
  transaction,
  transactionToUpdate,
  status,
  editType,
}: {
  transaction: EvmTransaction;
  transactionToUpdate: EvmTransaction;
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
