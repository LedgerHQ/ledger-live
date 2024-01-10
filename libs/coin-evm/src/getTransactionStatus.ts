import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import {
  AmountRequired,
  ETHAddressNonEIP,
  FeeNotLoaded,
  FeeTooHigh,
  GasLessThanEstimate,
  InvalidAddress,
  MaxFeeTooLow,
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  NotEnoughGas,
  PriorityFeeHigherThanMaxFee,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  RecipientRequired,
  ReplacementTransactionUnderpriced,
} from "@ledgerhq/errors";
import { Account, AccountBridge, SubAccount, TransactionStatusCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { NotEnoughNftOwned, NotOwnedNft, QuantityNeedsToBePositive } from "./errors";
import { getMinEip1559Fees, getMinLegacyFees } from "./editTransaction/getMinEditTransactionFees";
import { eip1559TransactionHasFees, getEstimatedFees, legacyTransactionHasFees } from "./logic";
import { DEFAULT_GAS_LIMIT } from "./transaction";
import {
  EditType,
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  TransactionStatus,
} from "./types";

type ValidatedTransactionFields =
  | "recipient"
  | "gasLimit"
  | "gasPrice"
  | "amount"
  | "maxPriorityFee"
  | "maxFee"
  | "feeTooHigh";
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
        const recipientChecksumed = ethers.utils.getAddress(tx.recipient);
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
 * Validate the amount of a transaction for an account
 */
const validateAmount = (
  account: Account | SubAccount,
  transaction: EvmTransaction,
  totalSpent: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  const isTokenTransaction = account?.type === "TokenAccount";
  const isSmartContractInteraction = !!transaction.data;

  /**
   * A transaction can have no amount if:
   * - it's a smart contract interaction not crafted by the Live
   * (i.e: data coming from a third party using Wallet-API for example)
   * OR
   * - it's an NFT transaction
   * (since for an NFT transaction, the "amount" is under the `nft.quantity` property)
   */
  const canHaveZeroAmount = isSmartContractInteraction && !isTokenTransaction;

  // if no amount or 0
  if ((!transaction.amount || transaction.amount.isZero()) && !canHaveZeroAmount) {
    errors.amount = new AmountRequired(); // "Amount required"
  } else if (totalSpent.isGreaterThan(account.balance)) {
    // if not enough to make the transaction
    errors.amount = new NotEnoughBalance(); // "Sorry, insufficient funds"
  }
  return [errors, warnings];
};

/**
 * Validate gas properties of a transaction, depending on its type and the account emitter
 */
const validateGas = (
  account: Account,
  tx: EvmTransaction,
  estimatedFees: BigNumber,
  gasLimit: BigNumber,
  customGasLimit?: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  // Gas Limit
  if (customGasLimit) {
    if (customGasLimit.isZero()) {
      errors.gasLimit = new FeeNotLoaded(); // "Could not load fee rates. Please set manual fees"
    } else if (customGasLimit.isLessThan(DEFAULT_GAS_LIMIT)) {
      errors.gasLimit = new GasLessThanEstimate(); // "This may be too low. Please increase"
    }
  } else {
    if (gasLimit.isZero()) {
      errors.gasLimit = new FeeNotLoaded(); // "Could not load fee rates. Please set manual fees"
    } else if (gasLimit.isLessThan(DEFAULT_GAS_LIMIT)) {
      errors.gasLimit = new GasLessThanEstimate(); // "This may be too low. Please increase"
    }
  }

  if (customGasLimit && customGasLimit.isLessThan(gasLimit)) {
    warnings.gasLimit = new GasLessThanEstimate(); // "This may be too low. Please increase"
  }

  // Gas Price
  if (
    // if fees are not set or wrongly set
    !(
      legacyTransactionHasFees(tx as EvmTransactionLegacy) ||
      eip1559TransactionHasFees(tx as EvmTransactionEIP1559)
    )
  ) {
    errors.gasPrice = new FeeNotLoaded(); // "Could not load fee rates. Please set manual fees"
  } else if (tx.recipient && estimatedFees.gt(account.balance)) {
    errors.gasPrice = new NotEnoughGas(); // "The parent account balance is insufficient for network fees"
  }

  // Gas Price for EIP-1559
  if (tx.type === 2) {
    const maximalPriorityFee = tx.gasOptions?.fast?.maxPriorityFeePerGas;
    const minimalPriorityFee = tx.gasOptions?.slow?.maxPriorityFeePerGas;
    const recommandedNextBaseFee = tx.gasOptions?.medium?.nextBaseFee;

    if (tx.maxPriorityFeePerGas.isZero()) {
      errors.maxPriorityFee = new PriorityFeeTooLow();
    } else if (tx.maxPriorityFeePerGas.isGreaterThan(tx.maxFeePerGas)) {
      // priority fee is more than max fee (total fee for the transaction) which doesn't make sense
      errors.maxPriorityFee = new PriorityFeeHigherThanMaxFee();
    }

    if (maximalPriorityFee && tx.maxPriorityFeePerGas.gt(maximalPriorityFee)) {
      warnings.maxPriorityFee = new PriorityFeeTooHigh();
    } else if (minimalPriorityFee && tx.maxPriorityFeePerGas.lt(minimalPriorityFee)) {
      warnings.maxPriorityFee = new PriorityFeeTooLow();
    }

    if (recommandedNextBaseFee && tx.maxFeePerGas?.lt(recommandedNextBaseFee)) {
      warnings.maxFee = new MaxFeeTooLow();
    }
  }

  return [errors, warnings];
};

const validateNft = (
  account: Account,
  tx: EvmTransaction,
  totalFees: BigNumber,
): Array<ValidationIssues> => {
  if (!tx.nft) return [{}, {}];

  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  const quantityIsPositive = tx.nft.quantity.gt(0);
  const nftFromAccount = account.nfts?.find(
    nft => nft.tokenId === tx.nft.tokenId && nft.contract === tx.nft.contract,
  );

  if (!nftFromAccount) {
    errors.amount = new NotOwnedNft();
  } else if (!quantityIsPositive) {
    errors.amount = new QuantityNeedsToBePositive();
  } else if (nftFromAccount.amount.lt(tx.nft.quantity)) {
    errors.amount = new NotEnoughNftOwned();
  } else if (totalFees.isGreaterThan(account.balance)) {
    // if not enough balance to pay fees
    errors.amount = new NotEnoughBalanceInParentAccount();
  }

  return [errors, warnings];
};

/**
 * Validate business logic related to the fee ratio of a transaction:
 * - if sending ETH, warn if fees are more than 10% of the amount
 */
const validateFeeRatio = (
  account: Account | SubAccount,
  tx: EvmTransaction,
  estimatedFees: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  const isTokenTransaction = account?.type === "TokenAccount";

  // If sending ETH (ie.: no tokens, no nft, no smart contract interactions)
  if (!tx.nft && !tx.data && !isTokenTransaction) {
    if (tx.amount.gt(0) && estimatedFees.times(10).gt(tx.amount)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }
  }

  return [errors, warnings];
};

/**
 * Validate a transaction and get all possibles errors and warnings about it
 */
export const getTransactionStatus: AccountBridge<EvmTransaction>["getTransactionStatus"] = async (
  account,
  tx,
) => {
  const subAccount = findSubAccountById(account, tx.subAccountId || "");
  const isTokenTransaction = subAccount?.type === "TokenAccount";
  const { gasLimit, customGasLimit, additionalFees, amount } = tx;
  const estimatedFees = getEstimatedFees(tx);
  const totalFees = estimatedFees.plus(additionalFees || 0);
  const totalSpent = isTokenTransaction ? tx.amount : tx.amount.plus(totalFees);

  // Recipient related errors and warnings
  const [recipientErr, recipientWarn] = validateRecipient(account, tx);
  // Amount related errors and warnings
  const [amountErr, amountWarn] = validateAmount(subAccount || account, tx, totalSpent);
  // Gas related errors and warnings
  const [gasErr, gasWarn] = validateGas(account, tx, totalFees, gasLimit, customGasLimit);
  // NFT related errors and warnings
  const [nftErr, nftWarn] = validateNft(account, tx, totalFees);
  // Fee ratio related errors and warnings
  const [feeRatioErr, feeRatioWarn] = validateFeeRatio(subAccount || account, tx, estimatedFees);

  const errors: ValidationIssues = {
    ...recipientErr,
    ...gasErr,
    ...amountErr,
    ...nftErr,
    ...feeRatioErr,
  };
  const warnings: ValidationIssues = {
    ...recipientWarn,
    ...gasWarn,
    ...amountWarn,
    ...nftWarn,
    ...feeRatioWarn,
  };

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

type EditTransactionValidatedTransactionFields = "replacementTransactionUnderpriced";
type EditTransactionValidationIssues = Partial<
  Record<EditTransactionValidatedTransactionFields, Error>
>;

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
  editType?: EditType;
}): {
  errors: TransactionStatusCommon["errors"];
  warnings: TransactionStatusCommon["warnings"];
} => {
  const errors: EditTransactionValidationIssues = {};
  const warnings: EditTransactionValidationIssues = {};

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

export default getTransactionStatus;
