import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";

export function computeAvailableAndEarnDeposit(accounts: AccountLike[]) {
  let spendable = new BigNumber(0);
  let total = new BigNumber(0);
  for (const account of accounts) {
    total = total.plus(account.balance);
    spendable = spendable.plus(account.spendableBalance);
  }
  const deposit = total.minus(spendable);
  return {
    availableBalance: spendable,
    earnDeposit: deposit.isPositive() ? deposit : new BigNumber(0),
  };
}
