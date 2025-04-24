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
import { STACKS_MAX_MEMO_SIZE } from "../constants";
import { StacksMemoTooLong } from "../errors";
import { Transaction, TransactionStatus } from "../types";
import { validateAddress } from "./utils/addresses";
import { getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";

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

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!validateAddress(recipient).isValid) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else if (address === recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!fee || fee.eq(0)) {
    errors.gas = new FeeNotLoaded();
  }

  const estimatedFees = fee || new BigNumber(0);
  let totalSpent: BigNumber;

  // Handle token transactions (subAccount exists)
  if (subAccount) {
    // For token transactions, fees are paid from the main account
    totalSpent = estimatedFees;

    // Check if main account has enough balance to pay fees
    if (totalSpent.gt(spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }

    // Check if token account has enough balance for the transaction
    const tokenSpendable = subAccount.spendableBalance;
    if (amount.gt(tokenSpendable)) {
      errors.amount = new NotEnoughBalance();
    } else if (amount.lte(0)) {
      errors.amount = new AmountRequired();
    }

    // Handle use all amount for tokens
    if (useAllAmount) {
      amount = tokenSpendable;
    }


    // For token transfers, total spent from token perspective is just the amount
    totalSpent = amount;
  } else {
    // Regular STX transfer
    if (useAllAmount) {
      totalSpent = spendableBalance;
      amount = totalSpent.minus(estimatedFees);

      if (amount.lte(0)) {
        errors.amount = new NotEnoughBalance();
      }
    } else {
      totalSpent = amount.plus(estimatedFees);

      if (amount.lte(0)) {
        errors.amount = new AmountRequired();
      } else if (totalSpent.gt(spendableBalance)) {
        errors.amount = new NotEnoughBalance();
      }
    }
  }

  const memoBytesLength = Buffer.from(memo ?? "", "utf-8").byteLength;
  if (memoBytesLength > STACKS_MAX_MEMO_SIZE) errors.transaction = new StacksMemoTooLong();

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
