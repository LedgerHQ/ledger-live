// @flow

import { BigNumber } from "bignumber.js";
import type {
  AccountLike,
  Account,
  Currency,
  CryptoCurrency,
  TokenCurrency,
} from "../../types";
import { getOperationAmountNumberWithInternals } from "../../operation";
import type { CounterValuesState } from "../../countervalues/types";
import { calculate, calculateMany } from "../../countervalues/logic";
import { flattenAccounts, getAccountCurrency } from "../../account";
import { getEnv } from "../../env";
import type {
  BalanceHistory,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
  AccountPortfolio,
  Portfolio,
  CurrencyPortfolio,
  AssetsDistribution,
  ValueChange,
} from "./types";
import { getPortfolioRangeConfig, getDates } from "./range";
import { defaultAssetsDistribution } from "../";
import type { AssetsDistributionOpts } from "../";

export function getPortfolioCount(
  accounts: AccountLike[],
  range: PortfolioRange
): number {
  const conf = getPortfolioRangeConfig(range);
  if (typeof conf.count === "number") return conf.count;
  if (!accounts.length) return 0;

  const startDate = new Date(
    Math.min(...accounts.map((a) => a.creationDate.getTime()))
  );

  return getPortfolioCountByDate(startDate, range);
}

export function getPortfolioCountByDate(
  start: Date,
  range: PortfolioRange
): number {
  const conf = getPortfolioRangeConfig(range);
  const now = Date.now();
  const count = Math.floor((now - start) / conf.increment) + 1;
  const defaultYearCount = getPortfolioRangeConfig("year").count ?? 0; // just for type casting
  return count < defaultYearCount ? defaultYearCount : count;
}

// take back the getBalanceHistory "js"
// TODO Portfolio: Account#balanceHistory would be DROPPED and replaced in future by another impl. (perf milestone)
export function getBalanceHistory(
  account: AccountLike,
  range: PortfolioRange,
  count: number
): BalanceHistory {
  const dates = getDates(range, count);

  const history = [];
  let { balance } = account;
  const operationsLength = account.operations.length;
  let i = 0; // index of operation
  history.unshift({ date: dates[dates.length - 1], value: balance.toNumber() });
  for (let d = dates.length - 2; d >= 0; d--) {
    const date = dates[d];
    // accumulate operations after time t
    while (i < operationsLength && account.operations[i].date > date) {
      balance = balance.minus(
        getOperationAmountNumberWithInternals(account.operations[i])
      );
      i++;
    }
    if (i === operationsLength) {
      // When there is no more operation, we consider we reached ZERO to avoid invalid assumption that balance was already available.
      balance = BigNumber(0);
    }
    history.unshift({ date, value: BigNumber.max(balance, 0).toNumber() });
  }
  return history;
}

export function getBalanceHistoryWithCountervalue(
  account: AccountLike,
  range: PortfolioRange,
  count: number,
  cvState: CounterValuesState,
  cvCurrency: Currency
): AccountPortfolio {
  const balanceHistory = getBalanceHistory(account, range, count);
  const currency = getAccountCurrency(account);
  const counterValues = calculateMany(cvState, balanceHistory, {
    from: currency,
    to: cvCurrency,
    disableRounding: true,
  });
  const history = balanceHistory.map(({ date, value }, i) => ({
    date,
    value,
    countervalue: counterValues[i],
  }));

  function calcChanges(h: BalanceHistoryWithCountervalue) {
    const from = h[0];
    const to = h[h.length - 1];
    return {
      countervalueReceiveSum: 0, // not available here
      countervalueSendSum: 0,
      cryptoChange: {
        value: to.value - from.value,
        percentage: null,
      },
      countervalueChange: {
        value: (to.countervalue || 0) - (from.countervalue || 0),
        percentage: meaningfulPercentage(
          (to.countervalue || 0) - (from.countervalue || 0),
          from.countervalue
        ),
      },
    };
  }

  const countervalueAvailable = Boolean(
    history[history.length - 1].countervalue
  );

  return {
    history,
    countervalueAvailable,
    ...calcChanges(history),
  };
}

function meaningfulPercentage(
  deltaChange: ?number,
  balanceDivider: ?number,
  percentageHighThreshold?: number = 100000
): ?number {
  if (deltaChange && balanceDivider && balanceDivider !== 0) {
    const percent = deltaChange / balanceDivider;
    if (percent < percentageHighThreshold) {
      return percent;
    }
  }
}

type Available = {
  account: AccountLike,
  history: BalanceHistoryWithCountervalue,
  change: ValueChange,
  countervalueReceiveSum: number,
  countervalueSendSum: number,
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
  cvState: CounterValuesState,
  cvCurrency: Currency
): Portfolio {
  const accounts = flattenAccounts(topAccounts);
  const count = getPortfolioCount(accounts, range);
  const { availables, unavailableAccounts } = accounts.reduce<{
    availables: Available[],
    unavailableAccounts: AccountLike[],
  }>(
    (prev, account) => {
      const p = getBalanceHistoryWithCountervalue(
        account,
        range,
        count,
        cvState,
        cvCurrency
      );
      return p.countervalueAvailable
        ? {
            ...prev,
            availables: [
              ...prev.availables,
              {
                account,
                history: p.history,
                change: p.countervalueChange,
                countervalueReceiveSum: p.countervalueReceiveSum,
                countervalueSendSum: p.countervalueSendSum,
              },
            ],
          }
        : {
            ...prev,
            unavailableAccounts: [...prev.unavailableAccounts, account],
          };
    },
    {
      availables: [],
      unavailableAccounts: [],
    }
  );
  const histories = availables.map((a) => a.history);
  const balanceHistory = getDates(range, count).map((date, i) => ({
    date,
    value: histories.reduce((sum, h) => sum + (h[i]?.countervalue ?? 0), 0),
  }));

  const [
    countervalueChangeValue,
    countervalueReceiveSum,
    countervalueSendSum,
  ] = availables.reduce(
    (prev, a) => [
      prev[0] + a.change.value,
      // TODO Portfolio: it'll always be 0, no? 🤔
      prev[1] + a.countervalueReceiveSum,
      prev[2] + a.countervalueSendSum,
    ],
    [0, 0, 0]
  );

  // in case there were no receive, we just track the market change
  // weighted by the current balances
  const balanceDivider = getEnv("EXPERIMENTAL_ROI_CALCULATION")
    ? countervalueReceiveSum === 0
      ? balanceHistory[0].value + countervalueSendSum
      : countervalueReceiveSum
    : balanceHistory[0].value;

  return {
    balanceHistory,
    balanceAvailable: accounts.length === 0 || availables.length > 0,
    availableAccounts: availables.map((a) => a.account),
    unavailableCurrencies: [
      ...new Set(unavailableAccounts.map(getAccountCurrency)),
    ],
    accounts,
    range,
    histories,
    countervalueReceiveSum,
    countervalueSendSum,
    countervalueChange: {
      percentage: meaningfulPercentage(countervalueChangeValue, balanceDivider),
      value: countervalueChangeValue,
    },
  };
}

export function getCurrencyPortfolio(
  accounts: AccountLike[],
  range: PortfolioRange,
  cvState: CounterValuesState,
  cvCurrency: Currency
): CurrencyPortfolio {
  const count = getPortfolioCount(accounts, range);
  const portfolios = accounts.map((a) =>
    getBalanceHistoryWithCountervalue(a, range, count, cvState, cvCurrency)
  );
  const histories = portfolios.map((p) => p.history);
  const history = getDates(range, count).map((date, i) => ({
    date,
    value: histories.reduce((sum, h) => sum + h[i]?.value, 0),
    countervalue: histories.reduce(
      (sum, h) => sum + (h[i]?.countervalue ?? 0),
      0
    ),
  }));

  const from = history[0];
  const to = history[history.length - 1];
  const cryptoChange = {
    value: to.value - from.value,
    percentage: null,
  };
  const countervalueChange = {
    value: (to.countervalue || 0) - (from.countervalue || 0),
    percentage: meaningfulPercentage(
      (to.countervalue || 0) - (from.countervalue || 0),
      from.countervalue
    ),
  };

  return {
    history,
    countervalueAvailable:
      portfolios[portfolios.length - 1].countervalueAvailable,
    accounts,
    range,
    histories,
    cryptoChange,
    countervalueChange,
  };
}

export function getAssetsDistribution(
  topAccounts: Account[],
  cvState: CounterValuesState,
  cvCurrency: Currency,
  opts?: AssetsDistributionOpts
): AssetsDistribution {
  const { minShowFirst, maxShowFirst, showFirstThreshold } = {
    ...defaultAssetsDistribution,
    ...opts,
  };
  const idBalances: { [key: string]: number } = {};
  const idCurrencies: { [key: string]: CryptoCurrency | TokenCurrency } = {};
  const accounts = flattenAccounts(topAccounts);
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const cur = getAccountCurrency(account);
    const id = cur.id;
    if (account.balance.isGreaterThan(0)) {
      idCurrencies[id] = cur;
      idBalances[id] = (idBalances[id] ?? 0) + account.balance.toNumber();
    }
  }

  const { sum, idCountervalues } = Object.entries(idBalances).reduce(
    (prev, [id, value]) => {
      const cv = calculate(cvState, {
        value: Number(value), // just for casting mixed type.
        from: idCurrencies[id],
        to: cvCurrency,
      });
      return cv
        ? {
            sum: prev.sum + cv,
            idCountervalues: { ...prev.idCountervalues, [id]: cv },
          }
        : prev;
    },
    { sum: 0, idCountervalues: {} }
  );

  const idCurrenciesKeys = Object.keys(idCurrencies);

  if (idCurrenciesKeys.length === 0) {
    return assetsDistributionNotAvailable;
  }

  const isAvailable = sum !== 0;

  const list = idCurrenciesKeys
    .map((id) => {
      const currency = idCurrencies[id];
      const amount = idBalances[id];
      const countervalue = idCountervalues[id] ?? 0;
      return {
        currency,
        countervalue,
        amount,
        distribution: isAvailable ? countervalue / sum : 0,
      };
    })
    .sort((a, b) => {
      const diff = b.countervalue - a.countervalue;
      return diff === 0 ? a.currency.name.localeCompare(b.currency.name) : diff;
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
  return data;
}

const assetsDistributionNotAvailable: AssetsDistribution = {
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: 0,
};
