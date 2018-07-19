/**
 * @flow
 * @module helpers/account
 */
import { BigNumber } from "bignumber.js";
import type {
  Account,
  Operation,
  BalanceHistory,
  DailyOperations
} from "../types";
import { getOperationAmountNumber } from "./operation";

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
  t = new Date(startOfDay(t) - 1); // end of yesterday
  for (let d = daysCount - 1; d > 0; d--) {
    // accumulate operations after time t
    while (i < account.operations.length && account.operations[i].date > t) {
      balance = balance.minus(getOperationAmountNumber(account.operations[i]));
      i++;
    }
    history.unshift({ date: t, value: BigNumber.max(balance, 0) });
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
  // for a given account, calculate the countervalue of a value at given date.
  calculateAccountCounterValue: (Account, BigNumber, Date) => BigNumber
): BalanceHistory {
  if (typeof calculateAccountCounterValue !== "function") {
    throw new Error(
      "getBalanceHistorySum signature has changed, please port the code"
    );
  }
  if (accounts.length === 0) {
    const now = Date.now();
    const zeros: BigNumber[] = Array(daysCount).fill(BigNumber(0));
    return zeros.map((value, i) => ({
      date: new Date(now - 24 * 60 * 60 * 1000 * (daysCount - i - 1)),
      value
    }));
  }
  return accounts
    .map(account => {
      const history = getBalanceHistory(account, daysCount);
      return history.map(h => ({
        date: h.date,
        value: calculateAccountCounterValue(account, h.value, h.date)
      }));
    })
    .reduce((acc, history) =>
      acc.map((a, i) => ({
        date: a.date,
        value: a.value.plus(history[i].value)
      }))
    );
}

const emptyDailyOperations = { sections: [], completed: true };

/**
 * @memberof helpers/account
 */
export function groupAccountsOperationsByDay(
  accounts: Account[],
  count: number
): DailyOperations {
  // Track indexes of account.operations[] for each account
  const indexes: number[] = Array(accounts.length).fill(0);
  // Track indexes of account.pendingOperations[] for each account
  const indexesPending: number[] = Array(accounts.length).fill(0);
  // Returns the most recent operation from the account with current indexes
  function getNextOperation(): ?Operation {
    let bestOp: ?Operation;
    let bestOpInfo = { accountI: 0, fromPending: false };
    for (let i = 0; i < accounts.length; i++) {
      // look in operations
      const op = accounts[i].operations[indexes[i]];
      if (op && (!bestOp || op.date > bestOp.date)) {
        bestOp = op;
        bestOpInfo = { accountI: i, fromPending: false };
      }
      // look in pending operations
      const opP = accounts[i].pendingOperations[indexesPending[i]];
      if (opP && (!bestOp || opP.date > bestOp.date)) {
        bestOp = opP;
        bestOpInfo = { accountI: i, fromPending: true };
      }
    }
    if (bestOp) {
      if (bestOpInfo.fromPending) {
        indexesPending[bestOpInfo.accountI]++;
      } else {
        indexes[bestOpInfo.accountI]++;
      }
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

/**
 * Return a list of `{count}` operations grouped by day.
 * @memberof helpers/account
 */
export function groupAccountOperationsByDay(
  account: Account,
  count: number
): DailyOperations {
  return groupAccountsOperationsByDay([account], count);
}
