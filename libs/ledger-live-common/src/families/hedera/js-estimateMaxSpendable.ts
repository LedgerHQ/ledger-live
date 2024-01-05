import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account/index";
import type { Transaction } from "./types";
import { getEstimatedFees } from "./utils";

export default async function estimateMaxSpendable({
  account,
  parentAccount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> {
  const balance = account.balance;

  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = await getEstimatedFees(mainAccount);

  let maxSpendable = balance.minus(estimatedFees);

  // set max spendable to 0 if negative
  // for cases where the user's account balance is smaller than the estimated fee
  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return Promise.resolve(maxSpendable);
}
