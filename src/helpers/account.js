// @flow
import type { Account, Unit } from "../types";
import type { CalculateCounterValue } from "./countervalue";

/*
*/
export type BalanceHistory = Array<{ date: Date, value: number }>;

/**
 * generate an array of {daysCount} datapoints, one per day,
 * for the balance history of an account.
 * The last item of the array is the balance available right now.
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
  t = new Date(t.getFullYear(), t.getMonth(), t.getDate()); // start of the day
  for (let d = 0; d < daysCount; d++) {
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
 */
export function getBalanceHistorySum(
  accounts: Account[],
  daysCount: number,
  fiatUnit: Unit,
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
      const calc = calculateCounterValue(account.currency, fiatUnit);
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
