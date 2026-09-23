import type {
  GranularityId,
  BalanceHistoryCache,
  BalanceHistoryDataCache,
  AccountLike,
  Account,
  TokenAccount,
} from "@ledgerhq/types-live";
import { getOperationAmountNumberWithInternals } from "../operation";

export const createEmptyHistoryCache = () => ({
  HOUR: {
    latestDate: null,
    balances: [],
  },
  DAY: {
    latestDate: null,
    balances: [],
  },
  WEEK: {
    latestDate: null,
    balances: [],
  },
});

export const emptyHistoryCache = createEmptyHistoryCache();

const hourIncrement = 60 * 60 * 1000;
const dayIncrement = 24 * hourIncrement;
const weekIncrement = 7 * dayIncrement;

export function startOfHour(t: Date): Date {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours());
}
export function startOfDay(t: Date): Date {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
export function startOfWeek(t: Date): Date {
  const d = startOfDay(t);
  return new Date(d.getTime() - d.getDay() * dayIncrement);
}

const granularities = {
  WEEK: {
    increment: weekIncrement,
    startOf: startOfWeek,
    maxDatapoints: 1000, // (essentially no limit)
  },
  DAY: {
    increment: dayIncrement,
    startOf: startOfDay,
    maxDatapoints: 400, // we only need a year
  },
  HOUR: {
    increment: hourIncrement,
    startOf: startOfHour,
    maxDatapoints: 8 * 24, // we only need a week
  },
};

function generateHistoryFromOperationsG(
  account: AccountLike,
  g: GranularityId, // partial=true allows a faster implementation that only recompose the last part of the history
  // to only use when we do not recalculate the history but we just want to access it
  partial = false,
): BalanceHistoryDataCache {
  const { increment, startOf, maxDatapoints } = granularities[g];
  const latestDate = startOf(new Date()).getTime();
  let balances: number[] = [];
  let { balance } = account;
  const operationsLength = account.operations.length;
  let date = latestDate;
  let i = 0;
  const reference = account.balanceHistoryCache?.[g];

  // The window is defined by the granularity, not by how many operations the account has.
  // Bounding this on the operation index left accounts with few or no operations holding a
  // short series, which the portfolio graph then pads with zeros.
  while (balances.length <= maxDatapoints) {
    // Stop before re-emitting the slot the stored series already ends on, otherwise the
    // concat below duplicates it and shifts every older slot by one increment.
    if (partial && reference?.latestDate && date <= reference.latestDate) {
      break;
    }

    // accumulate operations after time t
    while (
      i < operationsLength &&
      // FIXME: added valueOf here to make typescript happy
      account.operations[i].date.valueOf() > date
    ) {
      balance = balance.minus(getOperationAmountNumberWithInternals(account.operations[i]));
      i++;
    }

    balances.unshift(Math.max(balance.toNumber(), 0));
    date -= increment;
  }

  if (partial && reference?.balances) {
    balances = reference.balances.concat(balances);
  }

  return {
    balances,
    latestDate,
  };
}

export function generateHistoryFromOperations(account: AccountLike): BalanceHistoryCache {
  return {
    HOUR: generateHistoryFromOperationsG(account, "HOUR"),
    DAY: generateHistoryFromOperationsG(account, "DAY"),
    WEEK: generateHistoryFromOperationsG(account, "WEEK"),
  };
}

// A stored series is anchored to account.balance: it is produced by rewinding that balance
// through the operations. Once the balance moves without the series being regenerated, the two
// no longer describe the same account, and the portfolio graph appends the live balance as its
// final point, which renders as a cliff that reads like an outgoing transfer.
function isAnchoredToBalance(account: AccountLike, cache: BalanceHistoryDataCache): boolean {
  const { balances, latestDate } = cache;
  if (!balances.length || !latestDate) return false;

  // operations are newest first, so this walks at most the ones inside the latest slot
  let balance = account.balance;
  for (const operation of account.operations) {
    if (operation.date.valueOf() <= latestDate) break;
    balance = balance.minus(getOperationAmountNumberWithInternals(operation));
  }

  return balances[balances.length - 1] === Math.max(balance.toNumber(), 0);
}

/**
 * get the current balance history of the account. if possible from the cache.
 */
export function getAccountHistoryBalances(account: AccountLike, g: GranularityId): number[] {
  const cacheData = account.balanceHistoryCache?.[g];
  const { startOf } = granularities[g];
  const now = startOf(new Date()).getTime();
  const anchored = cacheData ? isAnchoredToBalance(account, cacheData) : false;

  if (anchored && cacheData?.latestDate === now) {
    return cacheData.balances;
  }

  // account cache was not up to date, missing, or anchored to a balance the account no longer
  // has. Only extend it when it is still anchored, otherwise rebuild it from the live balance.
  return generateHistoryFromOperationsG(account, g, anchored).balances;
}

/**
 * utility used at the end of an account synchronisation to recalculate the balance history if necessary
 */
export function recalculateAccountBalanceHistories<A extends Account = Account>(
  res: A,
  prev: A,
): A {
  // recalculate balance history cache
  if (prev.balanceHistoryCache === res.balanceHistoryCache) {
    // we only regenerate if it was not overriden by the implemenetation.
    res = { ...res, balanceHistoryCache: generateHistoryFromOperations(res) };
  }

  const prevSubAccounts = prev.subAccounts;
  const nextSubAccounts = res.subAccounts;

  if (nextSubAccounts && prevSubAccounts && prevSubAccounts !== nextSubAccounts) {
    // when sub accounts changes, we need to recalculate
    res.subAccounts = nextSubAccounts.map((subAccount: TokenAccount): TokenAccount => {
      const old = prevSubAccounts.find(a => a.id === subAccount.id);

      if (!old || old.balanceHistoryCache === subAccount.balanceHistoryCache) {
        // we only regenerate if it was not overriden by the implemenetation.
        subAccount = {
          ...subAccount,
          balanceHistoryCache: generateHistoryFromOperations(subAccount),
        };
      }

      return subAccount;
    });
  }

  return res;
}
