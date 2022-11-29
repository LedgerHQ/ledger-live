import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import {
  NotEnoughGas,
  FeeNotLoaded,
  InvalidAddress,
  ETHAddressNonEIP,
  RecipientRequired,
  AmountRequired,
  NotEnoughBalance,
  GasLessThanEstimate,
} from "@ledgerhq/errors";
import {
  eip1559TransactionHasFees,
  getEstimatedFees,
  legacyTransactionHasFees,
} from "./logic";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  Transaction as EvmTransaction,
} from "./types";

type ValidatedTransactionFields =
  | "recipient"
  | "gasLimit"
  | "gasPrice"
  | "amount";
type ValidationIssues = Partial<Record<ValidatedTransactionFields, Error>>;

const DEFAULT_GAS_LIMIT = new BigNumber(21000);
// This regex will not work with Starknet since addresses are 65 caracters long after the 0x
const ethAddressRegEx = /^(0x)?[0-9a-fA-F]{40}$/;

/**
 * Validate an address for a transaction
 */
export const validateRecipient = (
  account: Account,
  tx: EvmTransaction
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
  account: Account,
  transaction: EvmTransaction,
  totalSpent: BigNumber
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  // if no amount or 0
  if (!transaction.amount || transaction.amount.isZero()) {
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
  gasLimit: BigNumber,
  estimatedFees: BigNumber
): Array<ValidationIssues> => {
  const errors: ValidationIssues = {};
  const warnings: ValidationIssues = {};

  if (
    // if fees are not set or wrongly set
    !(
      legacyTransactionHasFees(tx as EvmTransactionLegacy) ||
      eip1559TransactionHasFees(tx as EvmTransactionEIP1559)
    )
  ) {
    errors.gasPrice = new FeeNotLoaded(); // "Could not load fee rates"
  } else if (gasLimit.isLessThan(21000)) {
    // minimum gas for a tx is 21000
    errors.gasLimit = new GasLessThanEstimate(); // "This may be too low. Please increase"
  } else if (tx.recipient && estimatedFees.gt(account.balance)) {
    errors.gasPrice = new NotEnoughGas(); // "The parent account balance is insufficient for network fees"
  }

  return [errors, warnings];
};

/**
 * Validate a transaction and get all possibles errors and warnings about it
 */
export const getTransactionStatus: AccountBridge<EvmTransaction>["getTransactionStatus"] =
  (account, tx) => {
    const gasLimit = tx.gasLimit || DEFAULT_GAS_LIMIT;
    const estimatedFees = getEstimatedFees(tx);
    const amount = tx.useAllAmount
      ? account.balance.minus(estimatedFees)
      : tx.amount;
    const totalSpent = amount?.plus(estimatedFees);

    // Recipient related errors and warnings
    const [recipientErr, recipientWarn] = validateRecipient(account, tx);
    // Amount related errors and warnings
    const [amountErr, amountWarn] = validateAmount(account, tx, totalSpent);
    // Gas related errors and warnings
    const [gasErr, gasWarn] = validateGas(account, tx, gasLimit, estimatedFees);

    const errors: ValidationIssues = {
      ...recipientErr,
      ...gasErr,
      ...amountErr,
    };
    const warnings: ValidationIssues = {
      ...recipientWarn,
      ...gasWarn,
      ...amountWarn,
    };

    return Promise.resolve({
      errors,
      warnings,
      estimatedFees,
      amount,
      totalSpent,
    });
  };

export default getTransactionStatus;
