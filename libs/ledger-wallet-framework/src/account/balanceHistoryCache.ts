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
  g: GranularityId,
): BalanceHistoryDataCache {
  const { increment, startOf, maxDatapoints } = granularities[g];
  const latestDate = startOf(new Date()).getTime();
  const balances: number[] = [];
  let { balance } = account;
  const operationsLength = account.operations.length;
  let date = latestDate;

  for (let i = 0; i < operationsLength;) {
    if (balances.length > maxDatapoints) {
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

function refreshHistoryFromOperationsG(
  account: AccountLike,
  g: GranularityId,
): BalanceHistoryDataCache {
  const { increment, startOf, maxDatapoints } = granularities[g];
  const latestDate = startOf(new Date()).getTime();
  const saved = account.balanceHistoryCache?.[g];
  const savedDate = saved?.latestDate;
  if (!saved?.balances.length || !savedDate) {
    return generateHistoryFromOperationsG(account, g);
  }
  const elapsedPeriods = (latestDate - savedDate) / increment;
  const gridLinesUp = Number.isInteger(elapsedPeriods) && elapsedPeriods >= 0;
  if (!gridLinesUp || elapsedPeriods > maxDatapoints) {
    return generateHistoryFromOperationsG(account, g);
  }

  const { operations } = account;
  const sinceSavedDate = Array.from<number>({ length: elapsedPeriods + 1 });
  let { balance } = account;
  let i = 0;
  for (let period = elapsedPeriods; period >= 0; period--) {
    const regenerationEndedEarlier = i === operations.length;
    if (regenerationEndedEarlier) return generateHistoryFromOperationsG(account, g);
    const date = savedDate + period * increment;
    while (i < operations.length && operations[i].date.valueOf() > date) {
      balance = balance.minus(getOperationAmountNumberWithInternals(operations[i]));
      i++;
    }
    sinceSavedDate[period] = Math.max(balance.toNumber(), 0);
  }

  const [balanceAtSavedDate, ...newBalances] = sinceSavedDate;
  if (balanceAtSavedDate !== saved.balances[saved.balances.length - 1]) {
    return generateHistoryFromOperationsG(account, g);
  }
  if (newBalances.length === 0) return saved;

  return {
    balances: saved.balances.concat(newBalances).slice(-(maxDatapoints + 1)),
    latestDate,
  };
}

/**
 * Extends the account's saved cache with the periods since its date. The saved points stay as
 * they are, even when operations older than that date were dropped since. A cache that does not
 * line up with the current periods or balance is regenerated.
 */
export function refreshHistoryFromOperations(account: AccountLike): BalanceHistoryCache {
  return {
    HOUR: refreshHistoryFromOperationsG(account, "HOUR"),
    DAY: refreshHistoryFromOperationsG(account, "DAY"),
    WEEK: refreshHistoryFromOperationsG(account, "WEEK"),
  };
}

/**
 * get the current balance history of the account. if possible from the cache.
 */
export function getAccountHistoryBalances(account: AccountLike, g: GranularityId): number[] {
  const cacheData = account.balanceHistoryCache?.[g];
  const { startOf } = granularities[g];
  const now = startOf(new Date()).getTime();

  if (cacheData?.balances && cacheData.latestDate && cacheData.latestDate === now) {
    return cacheData.balances;
  }

  return refreshHistoryFromOperationsG(account, g).balances;
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
