import BigNumber from "bignumber.js";
import { Account } from "../../types";
import { Transaction } from "./types";

export function calculateAmount({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): { amount: BigNumber; estimatedFees: BigNumber; totalSpent: BigNumber } {
  // NOTE: Hedera declares stable fees in USD
  //       If we can get the current USD/HBAR price here..
  //       > transfer fee is 0.0001 USD
  const estimatedFees = new BigNumber("83300"); // 0.000833 ℏ (as of 2021-09-20)

  const amount =
    transaction.useAllAmount == true
      ? // as fees are based on a currency conversion, we stay
        // on the safe side here and double the estimate for "max spendable"
        account.balance.minus(estimatedFees.multipliedBy(2))
      : transaction.amount;

  return {
    estimatedFees,
    amount,
    totalSpent: amount.plus(estimatedFees),
  };
}
