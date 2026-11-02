import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  AccountBalanceHistorySchema,
  DEFAULT_BALANCE_HISTORY_RANGE,
  type AccountBalanceHistory,
  type AccountBalanceHistoryQuery,
  type BalanceHistoryRange,
} from "@domain/entity-account-balance-history";
import { getBalanceHistory, getPortfolioCount } from "../../portfolio/portfolio";
import { toAmount } from "./balance";

const toSeries = (
  assetId: string,
  account: AccountLike,
  range: BalanceHistoryRange,
  count: number,
) => {
  const history = getBalanceHistory(account, range, count);
  const lastIndex = history.length - 1;
  return {
    assetId,
    points: history.map(({ date, value }, index) => ({
      date: date.toISOString(),
      // The cache holds JS numbers: the current point keeps the exact balance.
      balance: toAmount(index === lastIndex ? account.balance : new BigNumber(value)),
    })),
  };
};

/** The `balanceHistory` kind of a synced account: its native coin first, then each of its token accounts, all on the same dates. */
export function toAccountBalanceHistory(
  account: Account,
  query: AccountBalanceHistoryQuery | undefined,
): AccountBalanceHistory {
  const range = query?.range ?? DEFAULT_BALANCE_HISTORY_RANGE;
  const tokens = account.subAccounts ?? [];
  const count = getPortfolioCount([account, ...tokens], range);
  return AccountBalanceHistorySchema.parse({
    range,
    series: [
      toSeries(account.currency.id, account, range, count),
      ...tokens.map(token => toSeries(token.token.id, token, range, count)),
    ],
  });
}
