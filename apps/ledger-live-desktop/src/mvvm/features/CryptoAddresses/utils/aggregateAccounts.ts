import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";

export type CalculateCountervalue = (
  from: Currency,
  value: BigNumber,
) => BigNumber | null | undefined;

export function computeBalanceSortCountervalueByAccountId(
  rows: readonly AccountLike[],
  calculateCountervalue: CalculateCountervalue,
): Map<string, BigNumber | undefined> {
  const map = new Map<string, BigNumber | undefined>();
  for (const account of rows) {
    const currency = getAccountCurrency(account);
    const countervalue = calculateCountervalue(currency, account.balance);
    map.set(
      account.id,
      account.balance.isGreaterThan(0) && countervalue == null
        ? undefined
        : new BigNumber(countervalue ?? 0),
    );
  }
  return map;
}
