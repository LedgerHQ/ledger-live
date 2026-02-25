import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { StacksMemoTooLong } from "../errors";
import { Transaction, TransactionStatus } from "../types";
import { validateAddress } from "./utils/addresses";
import { getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";
import { validateMemo } from "../logic/validateMemo";

type ValidationErrors = TransactionStatus["errors"];

/**
 * Validates the recipient address
 */
function validateRecipient(
  recipient: string | undefined,
  accountAddress: string,
  currencyName: string,
  errors: ValidationErrors,
): void {
  if (!recipient) {
    errors.recipient = new RecipientRequired();
    return;
  }

  if (!validateAddress(recipient).isValid) {
    errors.recipient = new InvalidAddress("", { currencyName });
    return;
  }

  if (accountAddress === recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }
}

/**
 * Validates the transaction fee
 */
function validateFee(fee: BigNumber | undefined | null, errors: ValidationErrors): void {
  if (!fee || fee.eq(0)) {
    errors.gas = new FeeNotLoaded();
  }
}

/**
 * Handles amount validation and calculation for token transfers
 */
function handleTokenTransaction(
  amount: BigNumber,
  useAllAmount: boolean | undefined,
  tokenSpendable: BigNumber,
  estimatedFees: BigNumber,
  spendableBalance: BigNumber,
  errors: ValidationErrors,
): { amount: BigNumber; totalSpent: BigNumber } {
  // Check if main account has enough balance to pay fees
  if (estimatedFees.gt(spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  // Validate token amount
  if (amount.gt(tokenSpendable)) {
    errors.amount = new NotEnoughBalance();
  } else if (amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  // Handle use all amount for tokens
  const finalAmount = useAllAmount ? tokenSpendable : amount;

  return {
    amount: finalAmount,
    totalSpent: finalAmount,
  };
}

/**
 * Handles amount validation and calculation for STX transfers
 */
function handleStxTransaction(
  amount: BigNumber,
  useAllAmount: boolean | undefined,
  estimatedFees: BigNumber,
  spendableBalance: BigNumber,
  errors: ValidationErrors,
): { amount: BigNumber; totalSpent: BigNumber } {
  if (useAllAmount) {
    const totalSpent = spendableBalance;
    const finalAmount = totalSpent.minus(estimatedFees);

    if (finalAmount.lte(0)) {
      errors.amount = new NotEnoughBalance();
    }

    return { amount: finalAmount, totalSpent };
  }

  const totalSpent = amount.plus(estimatedFees);

  if (amount.lte(0)) {
    errors.amount = new AmountRequired();
  } else if (totalSpent.gt(spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  return { amount, totalSpent };
}

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { spendableBalance } = account;
  const { address } = getAddress(account);
  const subAccount = getSubAccount(account, transaction);
  const { memo, recipient, useAllAmount, fee } = transaction;
  let { amount } = transaction;

  // Validate recipient and fee
  validateRecipient(recipient, address, account.currency.name, errors);
  validateFee(fee, errors);

  const estimatedFees = fee || new BigNumber(0);
  let totalSpent: BigNumber;

  // Handle token vs STX transactions
  if (subAccount) {
    const result = handleTokenTransaction(
      amount,
      useAllAmount,
      subAccount.spendableBalance,
      estimatedFees,
      spendableBalance,
      errors,
    );
    amount = result.amount;
    totalSpent = result.totalSpent;
  } else {
    const result = handleStxTransaction(
      amount,
      useAllAmount,
      estimatedFees,
      spendableBalance,
      errors,
    );
    amount = result.amount;
    totalSpent = result.totalSpent;
  }

  // Validate memo
  if (memo && !validateMemo(memo)) {
    errors.transaction = new StacksMemoTooLong();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
