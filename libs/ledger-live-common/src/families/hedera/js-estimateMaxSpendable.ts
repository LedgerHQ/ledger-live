import BigNumber from "bignumber.js";
import { getEstimatedFees } from "./utils";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

export default async function estimateMaxSpendable({
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

  const estimatedFees = await getEstimatedFees();

  let maxSpendable = balance.minus(estimatedFees);

  // set max spendable to 0 if negative
  // for cases where the user's account balance is smaller than the estimated fee
  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return Promise.resolve(maxSpendable);
}
