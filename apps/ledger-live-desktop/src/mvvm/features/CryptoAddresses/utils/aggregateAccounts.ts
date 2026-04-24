import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";

export type CalculateCountervalue = (
  from: Currency,
  value: BigNumber,
) => BigNumber | null | undefined;

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
