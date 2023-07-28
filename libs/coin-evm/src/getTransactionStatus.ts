import {
  NotEnoughGas,
  FeeNotLoaded,
  InvalidAddress,
  ETHAddressNonEIP,
  RecipientRequired,
  AmountRequired,
  NotEnoughBalance,
  GasLessThanEstimate,
  PriorityFeeTooLow,
  PriorityFeeTooHigh,
  PriorityFeeHigherThanMaxFee,
  MaxFeeTooLow,
} from "@ledgerhq/errors";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { Account, AccountBridge, SubAccount } from "@ledgerhq/types-live";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { eip1559TransactionHasFees, getEstimatedFees, legacyTransactionHasFees } from "./logic";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  Transaction as EvmTransaction,
} from "./types";
import { NotEnoughNftOwned, NotOwnedNft, QuantityNeedsToBePositive } from "./errors";
import { DEFAULT_GAS_LIMIT } from "./transaction";

type ValidatedTransactionFields =
  | "recipient"
  | "gasLimit"
  | "gasPrice"
  | "amount"
  | "maxPriorityFee"
  | "maxFee";
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
        currency: account.currency,
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
export const validateAmount = (
  account: Account | SubAccount,
  transaction: EvmTransaction,
  totalSpent: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  const isTokenTransaction = account?.type === "TokenAccount";
  const isSmartContractInteraction = isTokenTransaction || transaction.data; // if the transaction is a smart contract interaction, it's normal that transaction has no amount
  const transactionHasFees =
    legacyTransactionHasFees(transaction as EvmTransactionLegacy) ||
    eip1559TransactionHasFees(transaction as EvmTransactionEIP1559);
  const canHaveZeroAmount = isSmartContractInteraction && transactionHasFees;

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
export const validateGas = (
  account: Account,
  tx: EvmTransaction,
  estimatedFees: BigNumber,
  gasLimit: BigNumber,
  customGasLimit?: BigNumber,
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  // Gas Limit
  if (gasLimit.isZero()) {
    errors.gasLimit = new FeeNotLoaded(); // "Could not load fee rates. Please set manual fees"
  } else if (gasLimit.isLessThan(DEFAULT_GAS_LIMIT)) {
    errors.gasLimit = new GasLessThanEstimate(); // "This may be too low. Please increase"
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

export const validateNft = (account: Account, tx: EvmTransaction): Array<ValidationIssues> => {
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
  const [nftErr, nftWarn] = validateNft(account, tx);

  const errors: ValidationIssues = {
    ...recipientErr,
    ...gasErr,
    ...amountErr,
    ...nftErr,
  };
  const warnings: ValidationIssues = {
    ...recipientWarn,
    ...gasWarn,
    ...amountWarn,
    ...nftWarn,
  };

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

export default getTransactionStatus;
