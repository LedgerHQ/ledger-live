import BigNumber from "bignumber.js";
import { estimatedFeeSafetyRate, estimatedFees } from './utils';
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

  return Promise.resolve(balance.minus(estimatedFee));
}
