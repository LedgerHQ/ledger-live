import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";

function getAccountMagnitude(account: AccountLike): number {
  const currency = account.type === "Account" ? account.currency : account.token;
  return currency.units[0]?.magnitude ?? 0;
}

export function computeAvailableAndEarnDeposit(
  accounts: AccountLike[],
  referenceMagnitude: number,
) {
  let spendable = new BigNumber(0);
  let total = new BigNumber(0);
  for (const account of accounts) {
    const shift = referenceMagnitude - getAccountMagnitude(account);
    total = total.plus(new BigNumber(account.balance).shiftedBy(shift));
    spendable = spendable.plus(new BigNumber(account.spendableBalance).shiftedBy(shift));
  }
  const deposit = total.minus(spendable);
  return {
    availableBalance: spendable,
    earnDeposit: deposit.isPositive() ? deposit : new BigNumber(0),
  };
}
