import BigNumber from "bignumber.js";
import { estimatedFeeSafetyRate, estimatedFees } from "./utils";
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
  const balance = account.balance;

  // as fees are based on a currency conversion, we stay
  // on the safe side here and double the estimate for "max spendable"
  const estimatedFee = estimatedFees.multipliedBy(estimatedFeeSafetyRate);

  let maxSpendable = balance.minus(estimatedFee);

  // set max spendable to 0 if negative
  // for cases where the user's account balance is smaller than the estimated fee
  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return Promise.resolve(maxSpendable);
}
