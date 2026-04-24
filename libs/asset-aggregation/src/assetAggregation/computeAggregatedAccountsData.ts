import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";

export type CalculateCountervalue = (
  from: Currency,
  value: BigNumber,
) => BigNumber | null | undefined;

export type AggregatedAccountEntry = {
  countervalue: BigNumber;
  subAccountsCount: number;
};

export function computeAggregatedAccountsData(
  accounts: AccountLike[],
  calculateCountervalue: CalculateCountervalue,
): Map<string, AggregatedAccountEntry> {
  const map = new Map<string, AggregatedAccountEntry>();

  for (const account of accounts) {
    if (account.type !== "Account") continue;

    const mainCv = calculateCountervalue(account.currency, account.balance);
    let countervalue = new BigNumber(mainCv ?? 0);

    const subs = account.subAccounts ?? [];
    for (const sub of subs) {
      const subCv = calculateCountervalue(sub.token, sub.balance);
      countervalue = countervalue.plus(subCv ?? 0);
    }

    map.set(account.id, { countervalue, subAccountsCount: subs.length });
  }

  return map;
}
