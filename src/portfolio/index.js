/**
 * @flow
 * @module portfolio
 */
import { BigNumber } from "bignumber.js";
import memoize from "lodash/memoize";
import last from "lodash/last";
import find from "lodash/find";
import type {
  AccountLikeArray,
  AccountLike,
  Account,
  BalanceHistory,
  AccountPortfolio,
  CurrencyPortfolio,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
  Portfolio,
  AssetsDistribution,
  TokenCurrency,
  CryptoCurrency,
} from "../types";
import { getOperationAmountNumberWithInternals } from "../operation";
import { flattenAccounts, getAccountCurrency } from "../account";
import { getEnv } from "../env";
import { getPortfolioRangeConfig, getDates } from "./range";

export * from "./range";

type GetBalanceHistory = (
  account: AccountLike,
  r: PortfolioRange
) => BalanceHistory;

/**
 * generate an array of {daysCount} datapoints, one per day,
 * for the balance history of an account.
 * The last item of the array is the balance available right now.
 * @memberof account
 */
const getBalanceHistoryImpl: GetBalanceHistory = (account, r) => {
  const conf = getPortfolioRangeConfig(r);
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
      balance = balance.minus(
        getOperationAmountNumberWithInternals(account.operations[i])
      );
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

export const getBalanceHistoryJS: GetBalanceHistory = memoize(
  getBalanceHistoryImpl,
  accountRateHash
);

export const getBalanceHistory: GetBalanceHistory = (account, r) => {
  // try to find it in the account object
  const { balanceHistory } = account;
  if (balanceHistory && balanceHistory[r] && balanceHistory[r].length > 1) {
    return balanceHistory[r];
  }

  // fallback on JS implementation
  return getBalanceHistoryJS(account, r);
};

type GetBalanceHistoryWithCountervalue = (
  account: AccountLike,
  r: PortfolioRange,
  calculateAccountCounterValue: (
    TokenCurrency | CryptoCurrency,
    BigNumber,
    Date
  ) => ?BigNumber,
  useEffectiveFrom?: boolean
) => AccountPortfolio;

// hash the "stable" part of the histo
// only the latest datapoint is "unstable" meaning it always changes because it's the current date.
const accountRateHashCVStable = (account, r, cvRef, useEffectiveFrom) =>
  `${accountRateHash(account, r)}_${cvRef ? cvRef.toString() : "none"}_${
    useEffectiveFrom ? "withEffectiveFrom" : ""
  }`;

const accountCVstableCache = {};
const ZERO = BigNumber(0);

const percentageHighThreshold = 100000;
const meaningfulPercentage = (
  deltaChange: ?BigNumber,
  balanceDivider: ?BigNumber
): ?BigNumber => {
  if (deltaChange && balanceDivider && !balanceDivider.isZero()) {
    const percent = deltaChange.div(balanceDivider);
    if (percent.lt(percentageHighThreshold)) {
      return percent;
    }
  }
};

export const getBalanceHistoryWithCountervalue: GetBalanceHistoryWithCountervalue = (
  account,
  r,
  calc,
  useEffectiveFrom = true
) => {
  const history = getBalanceHistory(account, r);
  const cur = getAccountCurrency(account);
  // a high enough value so we can compare if something changes
  const cacheReferenceValue = BigNumber("10").pow(3 + cur.units[0].magnitude);
  // pick a stable countervalue point in time to hash for the cache
  const cvRef = calc(cur, cacheReferenceValue, history[0].date);
  const mapFn = (p) => ({
    ...p,
    countervalue: (cvRef && calc(cur, p.value, p.date)) || ZERO,
  });
  const stableHash = accountRateHashCVStable(
    account,
    r,
    cvRef,
    useEffectiveFrom
  );
  let stable = accountCVstableCache[stableHash];
  const lastPoint = mapFn(history[history.length - 1]);

  const calcChanges = (h: BalanceHistoryWithCountervalue) => {
    // previous existing implementation here
    const from = h[0];
    const to = h[h.length - 1];
    const fromEffective = useEffectiveFrom
      ? find(h, (record) => record.value.isGreaterThan(0)) || from
      : from;
    return {
      countervalueReceiveSum: BigNumber(0), // not available here
      countervalueSendSum: BigNumber(0),
      cryptoChange: {
        value: to.value.minus(fromEffective.value),
        percentage: null,
      },
      countervalueChange: {
        value: (to.countervalue || ZERO).minus(
          fromEffective.countervalue || ZERO
        ),
        percentage: meaningfulPercentage(
          (to.countervalue || ZERO).minus(fromEffective.countervalue || ZERO),
          fromEffective.countervalue
        ),
      },
    };
  };

  if (!stable) {
    const h = history.map(mapFn);
    stable = {
      history: h,
      countervalueAvailable: !!cvRef,
      ...calcChanges(h),
    };
    accountCVstableCache[stableHash] = stable;
    return stable;
  }

  const lastStable = last(stable.history);
  if (lastPoint.countervalue.eq(lastStable.countervalue)) {
    return stable;
  }
  const h = stable.history.slice(0, -1).concat(lastPoint);
  const copy = {
    ...stable,
    history: h,
    ...calcChanges(h),
  };
  accountCVstableCache[stableHash] = copy;
  return copy;
};

/**
 * calculate the total balance history for all accounts in a reference fiat unit
 * and using a CalculateCounterValue function (see countervalue helper)
 * NB the last item of the array is actually the current total balance.
 * @memberof account
 */
export function getPortfolio(
  topAccounts: Account[],
  range: PortfolioRange,
  calc: (TokenCurrency | CryptoCurrency, BigNumber, Date) => ?BigNumber
): Portfolio {
  const accounts = flattenAccounts(topAccounts);
  const availableAccounts = [];
  const unavailableAccounts = [];
  const histories: BalanceHistoryWithCountervalue[] = [];
  const changes: BigNumber[] = [];
  const countervalueReceiveSums: BigNumber[] = [];
  const countervalueSendSums: BigNumber[] = [];

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const r = getBalanceHistoryWithCountervalue(account, range, calc, false);
    if (r.countervalueAvailable) {
      availableAccounts.push(account);
      histories.push(r.history);
      changes.push(r.countervalueChange.value);
      countervalueReceiveSums.push(r.countervalueReceiveSum);
      countervalueSendSums.push(r.countervalueSendSum);
    } else {
      unavailableAccounts.push(account);
    }
  }

  const unavailableCurrencies = [
    ...new Set(unavailableAccounts.map(getAccountCurrency)),
  ];

  const balanceAvailable =
    accounts.length === 0 || availableAccounts.length > 0;

  const balanceHistory = getDates(range).map((date) => ({ date, value: ZERO }));

  for (let i = 0; i < histories.length; i++) {
    const history = histories[i];
    for (let j = 0; j < history.length; j++) {
      const res = balanceHistory[j];
      if (res) {
        res.value = res.value.plus(history[j].countervalue);
      }
    }
  }

  const countervalueChangeValue: BigNumber = changes.reduce(
    (sum, v) => sum.plus(v),
    BigNumber(0)
  );
  const countervalueReceiveSum: BigNumber = countervalueReceiveSums.reduce(
    (sum, v) => sum.plus(v),
    BigNumber(0)
  );
  const countervalueSendSum: BigNumber = countervalueSendSums.reduce(
    (sum, v) => sum.plus(v),
    BigNumber(0)
  );

  // in case there were no receive, we just track the market change
  // weighted by the current balances
  let countervalueChangePercentage;
  if (getEnv("EXPERIMENTAL_ROI_CALCULATION")) {
    if (countervalueReceiveSum.isZero()) {
      countervalueChangePercentage = meaningfulPercentage(
        countervalueChangeValue,
        balanceHistory[0].value.plus(countervalueSendSum)
      );
    } else {
      countervalueChangePercentage = meaningfulPercentage(
        countervalueChangeValue,
        countervalueReceiveSum
      );
    }
  } else {
    countervalueChangePercentage = meaningfulPercentage(
      countervalueChangeValue,
      // in non experimental mode, we were dividing by first point
      balanceHistory[0].value
    );
  }

  const ret = {
    balanceHistory,
    balanceAvailable,
    availableAccounts,
    unavailableCurrencies,
    accounts,
    range,
    histories,
    countervalueReceiveSum,
    countervalueSendSum,
    countervalueChange: {
      percentage: countervalueChangePercentage,
      value: countervalueChangeValue,
    },
  };

  return ret;
}

/**
 * calculate the total balance history for all accounts in a reference fiat unit
 * and using a CalculateCounterValue function (see countervalue helper)
 * NB the last item of the array is actually the current total balance.
 * @memberof account
 */
export function getCurrencyPortfolio(
  accounts: AccountLikeArray,
  range: PortfolioRange,
  calc: (TokenCurrency | CryptoCurrency, BigNumber, Date) => ?BigNumber
): CurrencyPortfolio {
  const histories: BalanceHistoryWithCountervalue[] = [];

  let countervalueAvailable = false;

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const r = getBalanceHistoryWithCountervalue(account, range, calc);
    histories.push(r.history);
    countervalueAvailable = r.countervalueAvailable;
  }

  const history = getDates(range).map((date) => ({
    date,
    value: ZERO,
    countervalue: ZERO,
  }));

  for (let i = 0; i < histories.length; i++) {
    const h = histories[i];
    for (let j = 0; j < h.length; j++) {
      const res = history[j];
      res.value = res.value.plus(h[j].value);
      res.countervalue = res.countervalue.plus(h[j].countervalue);
    }
  }

  // previous existing implementation here
  const from = history[0];
  const to = history[history.length - 1];
  const fromEffective =
    find(history, (record) => record.value.isGreaterThan(0)) || from;
  const cryptoChange = {
    value: to.value.minus(from.value),
    percentage: null,
  };
  const countervalueChange = {
    value: (to.countervalue || ZERO).minus(fromEffective.countervalue || ZERO),
    percentage: meaningfulPercentage(
      (to.countervalue || ZERO).minus(fromEffective.countervalue || ZERO),
      fromEffective.countervalue
    ),
  };

  const ret = {
    history,
    countervalueAvailable,
    accounts,
    range,
    histories,
    cryptoChange,
    countervalueChange,
  };

  return ret;
}

const defaultAssetsDistribution = {
  minShowFirst: 1,
  maxShowFirst: 6,
  showFirstThreshold: 0.95,
};

type AssetsDistributionOpts = typeof defaultAssetsDistribution;

const assetsDistributionNotAvailable: AssetsDistribution = {
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: BigNumber(0),
};

const previousDistributionCache = {
  hash: "",
  data: assetsDistributionNotAvailable,
};

export function getAssetsDistribution(
  topAccounts: Account[],
  calculateCountervalue: (
    currency: TokenCurrency | CryptoCurrency,
    value: BigNumber
  ) => ?BigNumber,
  opts?: AssetsDistributionOpts
): AssetsDistribution {
  const { minShowFirst, maxShowFirst, showFirstThreshold } = {
    ...defaultAssetsDistribution,
    ...opts,
  };
  let sum = BigNumber(0);
  const idBalances = {};
  const idCurrencies = {};
  const accounts = flattenAccounts(topAccounts);
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const cur = getAccountCurrency(account);
    const id = cur.id;
    if (account.balance.isGreaterThan(0)) {
      idCurrencies[id] = cur;
      idBalances[id] = (idBalances[id] || BigNumber(0)).plus(account.balance);
    }
  }

  const idCountervalues = {};
  for (const id in idBalances) {
    const countervalue = calculateCountervalue(
      idCurrencies[id],
      idBalances[id]
    );
    if (countervalue) {
      idCountervalues[id] = countervalue;
      sum = sum.plus(countervalue);
    }
  }

  const idCurrenciesKeys = Object.keys(idCurrencies);

  if (idCurrenciesKeys.length === 0) {
    return assetsDistributionNotAvailable;
  }

  const isAvailable = !sum.isZero();

  const hash = `${idCurrenciesKeys.length}_${sum.toString()}`;
  if (hash === previousDistributionCache.hash) {
    return previousDistributionCache.data;
  }

  const list = idCurrenciesKeys
    .map((id) => {
      const currency = idCurrencies[id];
      const amount = idBalances[id];
      const countervalue = idCountervalues[id] || BigNumber(0);
      return {
        currency,
        countervalue,
        amount,
        distribution: isAvailable ? countervalue.div(sum).toNumber() : 0,
      };
    })
    .sort((a, b) => {
      const diff = b.countervalue.minus(a.countervalue).toNumber();
      if (diff === 0) return a.currency.name.localeCompare(b.currency.name);
      return diff;
    });

  let i;
  let acc = 0;
  for (i = 0; i < maxShowFirst && i < list.length; i++) {
    if (acc > showFirstThreshold) {
      break;
    }
    acc += list[i].distribution;
  }
  const showFirst = Math.max(minShowFirst, i);

  const data = { isAvailable, list, showFirst, sum };
  previousDistributionCache.hash = hash;
  previousDistributionCache.data = data;
  return data;
}
