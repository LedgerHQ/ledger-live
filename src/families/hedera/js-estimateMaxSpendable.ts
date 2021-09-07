import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "../../types";
import type { Transaction } from "./types";

export default function estimateMaxSpendable({
  account,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentAccount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> {
  let balance = account.balance;

  // NOTE: Hedera declares stable fees in USD
  //       If we can get the current USD/HBAR price here..
  //       > transfer fee is 0.0001 USD
  let estimatedFees = new BigNumber("83300"); // 0.000833 ℏ (as of 2021-09-20)

  // as fees are based on a currency conversion, we stay 
  // on the safe side here and double the estimate for "max spendable"
  estimatedFees = estimatedFees.multipliedBy(2);

  return Promise.resolve(balance.minus(estimatedFees));
}
