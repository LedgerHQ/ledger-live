import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency, listSubAccounts } from "@ledgerhq/live-common/account/helpers";

export type CalculateCountervalue = (
  from: Currency,
  value: BigNumber,
) => BigNumber | null | undefined;

export type AggregatedEntry = {
  readonly countervalue: BigNumber;
  readonly count: number;
};

export type AggregatedAccountData = ReadonlyMap<string, AggregatedEntry>;

export function computeAggregatedAccountsData(
  rows: readonly AccountLike[],
  calculateCountervalue: CalculateCountervalue,
): AggregatedAccountData {
  const map = new Map<string, AggregatedEntry>();

  for (const account of rows) {
    if (account.type !== "Account") continue;

    let countervalue = new BigNumber(0);
    let count = 0;

    if (!account.balance.isZero()) {
      const mainCurrency = getAccountCurrency(account);
      countervalue = countervalue.plus(
        calculateCountervalue(mainCurrency, account.balance) ?? new BigNumber(0),
      );
      count += 1;
    }

    const subs = listSubAccounts(account);
    for (const sub of subs) {
      const subCurrency = getAccountCurrency(sub);
      countervalue = countervalue.plus(
        calculateCountervalue(subCurrency, sub.balance) ?? new BigNumber(0),
      );
    }
    count += subs.length;

    map.set(account.id, { countervalue, count });
  }

  return map;
}

export function computeBalanceSortCountervalueByAccountId(
  rows: readonly AccountLike[],
  calculateCountervalue: CalculateCountervalue,
): Map<string, BigNumber> {
  const map = new Map<string, BigNumber>();
  for (const account of rows) {
    const currency = getAccountCurrency(account);
    map.set(account.id, calculateCountervalue(currency, account.balance) ?? new BigNumber(0));
  }
  return map;
}
