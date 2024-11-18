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

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { spendableBalance } = account;
  const { address } = getAddress(account);
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

  const totalSpent = useAllAmount ? spendableBalance : amount.plus(estimatedFees);
  amount = useAllAmount ? spendableBalance.minus(estimatedFees) : amount;

  if (amount.lte(0)) errors.amount = new AmountRequired();
  if (totalSpent.gt(spendableBalance)) errors.amount = new NotEnoughBalance();
  if (memo && memo.length > 34) errors.transaction = new StacksMemoTooLong();

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
