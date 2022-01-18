import estimateMaxSpendable from "./js-estimateMaxSpendable";
import BigNumber from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";

export async function calculateAmount({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<{
  amount: BigNumber;
  estimatedFees: BigNumber;
  totalSpent: BigNumber;
}> {
  // NOTE: Hedera declares stable fees in USD
  //       If we can get the current USD/HBAR price here..
  //       > transfer fee is 0.0001 USD
  const estimatedFees = new BigNumber("83300"); // 0.000833 ℏ (as of 2021-09-20)

  const amount =
    transaction.useAllAmount == true
      ? await estimateMaxSpendable({ account })
      : transaction.amount;

  return {
    estimatedFees,
    amount,
    totalSpent: amount.plus(estimatedFees),
  };
}
