import type {
  GranularityId,
  BalanceHistoryCache,
  BalanceHistoryDataCache,
  AccountLike,
  Account,
  SubAccount,
} from "@ledgerhq/types-live";
import { getOperationAmountNumberWithInternals } from "../operation";

export const emptyHistoryCache = {
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
};

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
  const reference = account.balanceHistoryCache[g];

  for (let i = 0; i < operationsLength; ) {
    if (
      (partial && reference.latestDate && date < reference.latestDate) ||
      balances.length > maxDatapoints
    ) {
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

  if (partial) {
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

/**
 * get the current balance history of the account. if possible from the cache.
 */
export function getAccountHistoryBalances(account: AccountLike, g: GranularityId): number[] {
  const { balances, latestDate } = account.balanceHistoryCache[g];
  const { startOf } = granularities[g];
  const now = startOf(new Date()).getTime();

  if (latestDate && latestDate === now) {
    return balances;
  }

  // account cache was not up to date. recalculating on the fly
  return generateHistoryFromOperationsG(account, g, true).balances;
}

/**
 * utility used at the end of an account synchronisation to recalculate the balance history if necessary
 */
export function recalculateAccountBalanceHistories(res: Account, prev: Account): Account {
  // recalculate balance history cache
  if (prev.balanceHistoryCache === res.balanceHistoryCache) {
    // we only regenerate if it was not overriden by the implemenetation.
    res = { ...res, balanceHistoryCache: generateHistoryFromOperations(res) };
  }

  const prevSubAccounts = prev.subAccounts;
  const nextSubAccounts = res.subAccounts;

  if (nextSubAccounts && prevSubAccounts && prevSubAccounts !== nextSubAccounts) {
    // when sub accounts changes, we need to recalculate
    res.subAccounts = nextSubAccounts.map((subAccount: SubAccount): SubAccount => {
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
