/**
 * @flow
 * @module portfolio
 */
import { BigNumber } from "bignumber.js";
import memoize from "lodash/memoize";
import last from "lodash/last";
import type {
  Account,
  BalanceHistory,
  BalanceHistoryWithCountervalue,
  PortfolioRange,
  Portfolio
} from "./types";
import { getOperationAmountNumber } from "./operation";

const dayIncrement = 24 * 60 * 60 * 1000;

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

const perPortfolioRange: { [k: PortfolioRange]: * } = {
  year: {
    count: 365,
    increment: dayIncrement,
    startOf: startOfDay
  },
  month: {
    count: 30,
    increment: dayIncrement,
    startOf: startOfDay
  },
  week: {
    count: 7,
    increment: dayIncrement, // TODO hourly
    startOf: startOfDay
  }
};

export function getDates(r: PortfolioRange): Date[] {
  const conf = perPortfolioRange[r];
  let t = new Date();
  const array = [t];
  t = new Date(conf.startOf(t) - 1); // end of yesterday
  for (let d = conf.count - 1; d > 0; d--) {
    array.unshift(t);
    t = new Date(t - conf.increment);
  }
  return array;
}

type GetBalanceHistory = (
  account: Account,
  r: PortfolioRange
) => BalanceHistory;

/**
 * generate an array of {daysCount} datapoints, one per day,
 * for the balance history of an account.
 * The last item of the array is the balance available right now.
 * @memberof account
 */
const getBalanceHistoryImpl: GetBalanceHistory = (account, r) => {
  const conf = perPortfolioRange[r];
  const history = [];
  let { balance } = account;
  const operationsLength = account.operations.length;
  let i = 0; // index of operation
  let t = new Date();
  history.unshift({ date: t, value: balance });
  t = new Date(conf.startOf(t) - 1); // end of yesterday
  for (let d = conf.count - 1; d > 0; d--) {
    // accumulate operations after time t
    while (i < operationsLength && account.operations[i].date > t) {
      balance = balance.minus(getOperationAmountNumber(account.operations[i]));
      i++;
    }
    if (i === operationsLength) {
      // When there is no more operation, we consider we reached ZERO to avoid invalid assumption that balance was already available.
      balance = BigNumber(0);
    }
    history.unshift({ date: t, value: BigNumber.max(balance, 0) });
    t = new Date(t - conf.increment);
  }
  return history;
};

const accountRateHash = (account, r) =>
  `${r}_${account.id}_${account.balance.toString()}_${
    account.operations[0] ? account.operations[0].id : ""
  }`;

export const getBalanceHistory: GetBalanceHistory = memoize(
  getBalanceHistoryImpl,
  accountRateHash
);

type GetBalanceHistoryWithCountervalue = (
  account: Account,
  r: PortfolioRange,
  calculateAccountCounterValue: (Account, BigNumber, Date) => ?BigNumber
) => {
  history: BalanceHistoryWithCountervalue,
  countervalueAvailable: boolean
};

// hash the "stable" part of the histo
// only the latest datapoint is "unstable" meaning it always changes because it's the current date.
const accountRateHashCVStable = (account, r, cvRef) =>
  `${accountRateHash(account, r)}_${cvRef ? cvRef.toString() : "none"}`;

const accountCVstableCache = {};
const HIGH_VALUE = BigNumber("10000000000000000");
const ZERO = BigNumber(0);

const getBHWCV: GetBalanceHistoryWithCountervalue = (account, r, calc) => {
  const histo = getBalanceHistory(account, r);
  // pick a stable countervalue point in time to hash for the cache
  const cvRef = calc(account, HIGH_VALUE, histo[0].date);
  const mapFn = p => ({
    ...p,
    countervalue: (cvRef && calc(account, p.value, p.date)) || ZERO
  });
  const stableHash = accountRateHashCVStable(account, r, cvRef);
  let stable = accountCVstableCache[stableHash];
  const lastPoint = mapFn(histo[histo.length - 1]);
  if (!stable) {
    stable = {
      history: histo.map(mapFn),
      countervalueAvailable: !!cvRef
    };
    accountCVstableCache[stableHash] = stable;
    return stable;
  }

  const lastStable = last(stable.history);
  if (lastPoint.countervalue.eq(lastStable.countervalue)) {
    return stable;
  }
  const copy = {
    ...stable,
    history: stable.history.slice(0, -1).concat(lastPoint)
  };
  accountCVstableCache[stableHash] = copy;
  return copy;
};

export const getBalanceHistoryWithCountervalue = getBHWCV;

const portfolioMemo: { [_: *]: Portfolio } = {};
/**
 * calculate the total balance history for all accounts in a reference fiat unit
 * and using a CalculateCounterValue function (see countervalue helper)
 * NB the last item of the array is actually the current total balance.
 * @memberof account
 */
export function getPortfolio(
  accounts: Account[],
  range: PortfolioRange,
  calc: (Account, BigNumber, Date) => ?BigNumber
): Portfolio {
  const availableAccounts = [];
  const unavailableAccounts = [];
  const histories = [];

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const r = getBalanceHistoryWithCountervalue(account, range, calc);
    if (r.countervalueAvailable) {
      availableAccounts.push(account);
      histories.push(r.history);
    } else {
      unavailableAccounts.push(account);
    }
  }

  const unavailableCurrencies = [
    ...new Set(unavailableAccounts.map(a => a.currency))
  ];

  const balanceAvailable =
    accounts.length === 0 || availableAccounts.length > 0;

  const memo = portfolioMemo[range];
  if (memo && memo.histories.length === histories.length) {
    let sameHisto = true;
    for (let i = 0; i < histories.length; i++) {
      if (histories[i] !== memo.histories[i]) {
        sameHisto = false;
        break;
      }
    }
    if (sameHisto) {
      if (
        accounts.length === memo.accounts.length &&
        availableAccounts.length === memo.availableAccounts.length
      ) {
        return memo;
      }
      return {
        balanceHistory: memo.balanceHistory,
        balanceAvailable,
        availableAccounts,
        unavailableCurrencies,
        accounts,
        range,
        histories
      };
    }
  }

  const balanceHistory = getDates(range).map(date => ({ date, value: ZERO }));

  for (let i = 0; i < histories.length; i++) {
    const history = histories[i];
    for (let j = 0; j < history.length; j++) {
      const res = balanceHistory[j];
      res.value = res.value.plus(history[j].countervalue);
    }
  }

  const ret = {
    balanceHistory,
    balanceAvailable,
    availableAccounts,
    unavailableCurrencies,
    accounts,
    range,
    histories
  };

  portfolioMemo[range] = ret;

  return ret;
}
