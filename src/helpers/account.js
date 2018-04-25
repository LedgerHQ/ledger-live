/**
 * @flow
 * @module helpers/account
 */
import type {
  Account,
  Operation,
  Currency,
  BalanceHistory,
  CalculateCounterValue,
  DailyOperations
} from "../types";

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/**
 * generate an array of {daysCount} datapoints, one per day,
 * for the balance history of an account.
 * The last item of the array is the balance available right now.
 * @memberof helpers/account
 */
export function getBalanceHistory(
  account: Account,
  daysCount: number
): BalanceHistory {
  const history = [];
  let { balance } = account;
  let i = 0; // index of operation
  let t = new Date();
  history.unshift({ date: t, value: balance });
  t = startOfDay(t); // start of the day
  for (let d = daysCount - 1; d > 0; d--) {
    // accumulate operations after time t
    while (i < account.operations.length && account.operations[i].date > t) {
      balance -= account.operations[i].amount;
      i++;
    }
    history.unshift({ date: t, value: balance });
    t = new Date(t - 24 * 60 * 60 * 1000);
  }
  return history;
}

/**
 * calculate the total balance history for all accounts in a reference fiat unit
 * and using a CalculateCounterValue function (see countervalue helper)
 * NB the last item of the array is actually the current total balance.
 * @memberof helpers/account
 */
export function getBalanceHistorySum(
  accounts: Account[],
  daysCount: number,
  currency: Currency,
  calculateCounterValue: CalculateCounterValue
): BalanceHistory {
  if (accounts.length === 0) {
    const now = Date.now();
    const zeros: 0[] = Array(daysCount).fill(0);
    return zeros.map((value, i) => ({
      date: new Date(now - 24 * 60 * 60 * 1000 * (daysCount - i - 1)),
      value
    }));
  }
  return accounts
    .map(account => {
      const history = getBalanceHistory(account, daysCount);
      const calc = calculateCounterValue(account.currency, currency);
      return history.map(h => ({
        date: h.date,
        value: calc(h.value, h.date)
      }));
    })
    .reduce((acc, history) =>
      acc.map((a, i) => ({
        date: a.date,
        value: a.value + history[i].value
      }))
    );
}

const emptyDailyOperations = { sections: [], completed: true };

/**
 * Return a list of `{count}` operations grouped by day.
 * @memberof helpers/account
 */
export function groupAccountOperationsByDay(
  account: Account,
  count: number
): DailyOperations {
  const { operations } = account;
  if (operations.length === 0) return emptyDailyOperations;
  const sections = [];
  let day = startOfDay(operations[0].date);
  let data = [];
  const max = Math.min(count, operations.length);
  for (let i = 0; i < max; i++) {
    const op = operations[i];
    if (op.date < day) {
      sections.push({ day, data });
      day = startOfDay(op.date);
      data = [op];
    } else {
      data.push(op);
    }
  }
  sections.push({ day, data });
  return {
    sections,
    completed: count >= operations.length
  };
}

/**
 * @memberof helpers/account
 */
export function groupAccountsOperationsByDay(
  accounts: Account[],
  count: number
): DailyOperations {
  // Track indexes of account.operations[] for each account
  const indexes: number[] = Array(accounts.length).fill(0);
  // Returns the most recent operation from the account with current indexes
  function getNextOperation(): ?Operation {
    let bestOp: ?Operation,
      bestOpIndex = 0;
    for (let i = 0; i < accounts.length; i++) {
      const op = accounts[i].operations[indexes[i]];
      if (op && (!bestOp || op.date > bestOp.date)) {
        bestOp = op;
        bestOpIndex = i;
      }
    }
    if (bestOp) {
      indexes[bestOpIndex]++;
    }
    return bestOp;
  }

  let op = getNextOperation();
  if (!op) return emptyDailyOperations;
  const sections = [];
  let day = startOfDay(op.date);
  let data = [];
  for (let i = 0; i < count && op; i++) {
    if (op.date < day) {
      sections.push({ day, data });
      day = startOfDay(op.date);
      data = [op];
    } else {
      data.push(op);
    }
    op = getNextOperation();
  }
  sections.push({ day, data });
  return {
    sections,
    completed: !op
  };
}
