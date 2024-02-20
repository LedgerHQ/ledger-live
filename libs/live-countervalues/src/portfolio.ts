import type { CounterValuesState } from "./types";
import { calculate, calculateMany } from "./logic";
import {
  flattenAccounts,
  getAccountCurrency,
  getAccountHistoryBalances,
} from "@ledgerhq/coin-framework/account/index";
import { getEnv } from "@ledgerhq/live-env";
import type {
  Account,
  AccountLike,
  BalanceHistory,
  PortfolioRange,
  PortfolioRangeConfig,
  BalanceHistoryWithCountervalue,
  AccountPortfolio,
  Portfolio,
  CurrencyPortfolio,
  AssetsDistribution,
} from "@ledgerhq/types-live";
import type { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { listSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/support";

export const defaultAssetsDistribution = {
  minShowFirst: 1,
  maxShowFirst: 6,
  showFirstThreshold: 0.95,
  showEmptyAccounts: false,
  hideEmptyTokenAccount: false,
};
export type AssetsDistributionOpts = typeof defaultAssetsDistribution;

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

// TODO Portfolio: this would require to introduce Account#olderOperationDate
const ranges: Record<PortfolioRange, PortfolioRangeConfig> = {
  all: {
    increment: weekIncrement,
    startOf: startOfWeek,
    granularityId: "WEEK",
  },
  year: {
    count: 52,
    increment: weekIncrement,
    startOf: startOfWeek,
    granularityId: "WEEK",
  },
  month: {
    count: 30,
    increment: dayIncrement,
    startOf: startOfDay,
    granularityId: "DAY",
  },
  week: {
    count: 7 * 24,
    increment: hourIncrement,
    startOf: startOfHour,
    granularityId: "HOUR",
  },
  day: {
    count: 24,
    increment: hourIncrement,
    startOf: startOfHour,
    granularityId: "HOUR",
  },
};

export function getRanges(): string[] {
  return Object.keys(ranges);
}

export function getDates(r: PortfolioRange, count: number): Date[] {
  const now = new Date(Date.now());
  if (count === 1) return [now];
  const conf = getPortfolioRangeConfig(r);
  const last = new Date(conf.startOf(now).getTime() - 1).getTime();
  const dates = [now];

  for (let i = 0; i < count - 1; i++) {
    dates.unshift(new Date(last - conf.increment * i));
  }

  return dates;
}

export function getPortfolioRangeConfig(r: PortfolioRange): PortfolioRangeConfig {
  return ranges[r];
}

export function getPortfolioCount(accounts: AccountLike[], range: PortfolioRange): number {
  const conf = getPortfolioRangeConfig(range);
  if (typeof conf.count === "number") return conf.count;
  if (!accounts.length) return 0;
  let oldestDate = accounts[0].creationDate;

  for (let i = 1; i < accounts.length; i++) {
    const d = accounts[i].creationDate;

    if (d < oldestDate) {
      oldestDate = d;
    }
  }

  return getPortfolioCountByDate(oldestDate, range);
}

export function getPortfolioCountByDate(start: Date, range: PortfolioRange): number {
  const conf = getPortfolioRangeConfig(range);
  const now = Date.now();
  const count = Math.ceil((now - start.getTime()) / conf.increment) + 2;
  const defaultYearCount = getPortfolioRangeConfig("year").count ?? 0; // just for type casting

  return count < defaultYearCount ? defaultYearCount : count;
}

export function getBalanceHistory(
  account: AccountLike,
  range: PortfolioRange,
  count: number,
): BalanceHistory {
  const conf = getPortfolioRangeConfig(range);
  const balances = getAccountHistoryBalances(account, conf.granularityId);
  const history: { date: Date; value: number }[] = [];
  const now = new Date();
  history.unshift({
    date: now,
    value: account.balance.toNumber(),
  });
  const t = new Date(conf.startOf(now).getTime() - 1).getTime(); // end of yesterday

  for (let i = 0; i < count - 1; i++) {
    history.unshift({
      date: new Date(t - conf.increment * i),
      value: balances[balances.length - 1 - i] ?? 0,
    });
  }

  return history;
}

export function getBalanceHistoryWithCountervalue(
  account: AccountLike,
  range: PortfolioRange,
  count: number,
  cvState: CounterValuesState,
  cvCurrency: Currency,
): AccountPortfolio {
  const balanceHistory = getBalanceHistory(account, range, count);
  const currency = getAccountCurrency(account);
  const counterValues = calculateMany(cvState, balanceHistory, {
    from: currency,
    to: cvCurrency,
  });
  let countervalueAvailable = false;
  const history: Array<{
    date: Date;
    value: number;
    countervalue: number | null | undefined;
  }> = [];

  for (let i = 0; i < balanceHistory.length; i++) {
    const { date, value } = balanceHistory[i];
    const countervalue = counterValues[i];
    if (countervalue !== undefined && countervalue !== null) {
      countervalueAvailable = true;
    }
    history.push({
      date,
      value,
      countervalue,
    });
  }

  function calcChanges(h: BalanceHistoryWithCountervalue) {
    const from = h[0];
    const to = h[h.length - 1];
    return {
      countervalueReceiveSum: 0,
      // not available here
      countervalueSendSum: 0,
      cryptoChange: {
        value: to.value - from.value,
        percentage: null,
      },
      countervalueChange: {
        value: (to.countervalue || 0) - (from.countervalue || 0),
        percentage: meaningfulPercentage(
          (to.countervalue || 0) - (from.countervalue || 0),
          from.countervalue,
        ),
      },
    };
  }

  return {
    history,
    countervalueAvailable,
    ...calcChanges(history),
  };
}

function meaningfulPercentage(
  deltaChange: number | null | undefined,
  balanceDivider: number | null | undefined,
  percentageHighThreshold = 100000,
): number | null | undefined {
  if (deltaChange && balanceDivider && balanceDivider !== 0) {
    const percent = deltaChange / balanceDivider;

    if (percent < percentageHighThreshold) {
      return percent;
    }
  }
}

const defaultGetPortfolioOptions = {
  flattenSourceAccounts: true,
};

export type GetPortfolioOptionsType = {
  flattenSourceAccounts?: boolean;
};

/**
 * calculate the total balance history for all accounts in a reference fiat unit
 * and using a CalculateCounterValue function (see countervalue helper)
 * NB the last item of the array is actually the current total balance.
 * @memberof account
 */
export function getPortfolio(
  topAccounts: AccountLike[],
  range: PortfolioRange,
  cvState: CounterValuesState,
  cvCurrency: Currency,
  options?: GetPortfolioOptionsType,
): Portfolio {
  const { flattenSourceAccounts } = {
    ...defaultGetPortfolioOptions,
    ...options,
  };
  const accounts = flattenSourceAccounts ? flattenAccounts(topAccounts) : topAccounts;
  const count = getPortfolioCount(accounts, range);

  const availables = [];
  const unavailableAccounts = [];

  for (const account of accounts) {
    const p = getBalanceHistoryWithCountervalue(account, range, count, cvState, cvCurrency);
    if (p.countervalueAvailable) {
      availables.push({
        account,
        history: p.history,
        change: p.countervalueChange,
        countervalueReceiveSum: p.countervalueReceiveSum,
        countervalueSendSum: p.countervalueSendSum,
      });
    } else {
      unavailableAccounts.push(account);
    }
  }

  const histories = availables.map(a => a.history);
  const balanceHistory = getDates(range, count).map((date, i) => ({
    date,
    value: histories.reduce((sum, h) => sum + (h[i]?.countervalue ?? 0), 0),
  }));
  const [countervalueChangeValue, countervalueReceiveSum, countervalueSendSum] = availables.reduce(
    (prev, a) => [
      prev[0] + a.change.value, // TODO Portfolio: it'll always be 0, no? 🤔
      prev[1] + a.countervalueReceiveSum,
      prev[2] + a.countervalueSendSum,
    ],
    [0, 0, 0],
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
    availableAccounts: availables.map(a => a.account),
    unavailableCurrencies: [...new Set(unavailableAccounts.map(getAccountCurrency))],
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
  cvCurrency: Currency,
): CurrencyPortfolio {
  const count = getPortfolioCount(accounts, range);
  const portfolios = accounts.map(a =>
    getBalanceHistoryWithCountervalue(a, range, count, cvState, cvCurrency),
  );
  let countervalueAvailable = false;
  const histories = portfolios.map(p => {
    if (p.countervalueAvailable) {
      countervalueAvailable = true;
    }

    return p.history;
  });
  const history = getDates(range, count).map((date, i) => ({
    date,
    value: histories.reduce((sum, h) => sum + h[i]?.value, 0),
    countervalue: histories.reduce((sum, h) => sum + (h[i]?.countervalue ?? 0), 0),
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
      from.countervalue,
    ),
  };
  return {
    history,
    countervalueAvailable,
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
  opts?: AssetsDistributionOpts,
): AssetsDistribution {
  const {
    minShowFirst,
    maxShowFirst,
    showFirstThreshold,
    showEmptyAccounts,
    hideEmptyTokenAccount,
  } = {
    ...defaultAssetsDistribution,
    ...opts,
  };
  const idBalances: Record<string, number> = {};
  const idCurrencies: Record<string, CryptoCurrency | TokenCurrency> = {};
  const currenciesAccounts: Record<string, AccountLike[]> = {};
  const accounts = flattenAccounts(topAccounts);

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const cur = getAccountCurrency(account);
    const id = cur.id;

    if (!currenciesAccounts[id]) {
      currenciesAccounts[id] = [account];
    } else {
      currenciesAccounts[id].push(account);
    }

    if (account.type === "TokenAccount") {
      if (!hideEmptyTokenAccount || account.balance.isGreaterThan(0)) {
        idCurrencies[id] = cur;
        idBalances[id] = (idBalances[id] ?? 0) + account.balance.toNumber();
      }
    } else {
      if (showEmptyAccounts || account.balance.isGreaterThan(0)) {
        idCurrencies[id] = cur;
        idBalances[id] = (idBalances[id] ?? 0) + account.balance.toNumber();
      }
    }
  }

  const idCountervalues: Record<string, number | undefined> = {};
  let sum = 0;

  for (const [id, value] of Object.entries(idBalances)) {
    const cv = calculate(cvState, {
      value: Number(value),
      from: idCurrencies[id],
      to: cvCurrency,
    });
    if (cv) {
      sum += cv;
      idCountervalues[id] = cv;
    }
  }

  const idCurrenciesKeys = Object.keys(idCurrencies);

  if (idCurrenciesKeys.length === 0) {
    return assetsDistributionNotAvailable;
  }

  const isAvailable = sum !== 0 || showEmptyAccounts;
  const list = idCurrenciesKeys
    .map(id => {
      const currency = idCurrencies[id];
      const amount = idBalances[id];
      const countervalue = idCountervalues[id] ?? 0;
      const currencyAccounts = currenciesAccounts[id];
      return {
        currency,
        countervalue,
        amount,
        distribution: isAvailable
          ? sum !== 0
            ? countervalue / sum
            : 1 / idCurrenciesKeys.length
          : 0,
        accounts: currencyAccounts,
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
  const data = {
    isAvailable,
    list,
    showFirst,
    sum,
  };
  return data;
}
const assetsDistributionNotAvailable: AssetsDistribution = {
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: 0,
};

/**
 * data structure to represent a market datapoint
 * NB: the UI don't actual need the "current value" in this data, because it can directly calculate it with the countervalue context. but it's set in order to internally sort the data and possibly debug it
 */
export type PerformanceMarketDatapoint = {
  currency: Currency;
  change: number;
  currentValue: number;
  referenceValue: number;
};

/**
 * retrieve the list of market datapoints to use for the Market Performance feature
 * the data is sorted from best performer to worst performer.
 * it possibly filters out any invalid data, therefore the list can be empty.
 */
export function makePerformanceMarketAssetsList(
  /**
   * the countervalue state to use to calculate the performance.
   */
  cvState: CounterValuesState,
  /**
   * countervalue is the currency to use as reference to calculate the performance.
   */
  countervalue: Currency,
  /**
   * assets is the list of assets to consider. it is expected for them to have data loaded in cvState.
   */
  assets: Currency[],
  /**
   * referenceDate is the date to use as reference to calculate the performance.
   */
  referenceDate: Date,
): PerformanceMarketDatapoint[] {
  const list: PerformanceMarketDatapoint[] = [];

  const supported = new Set(listSupportedCurrencies());
  for (const asset of assets) {
    if (asset.type === "CryptoCurrency") {
      if (!supported.has(asset)) continue;
    } else if (asset.type === "TokenCurrency") {
      if (!supported.has(asset.parentCurrency)) continue;
    }
    const from = asset;
    const to = countervalue;
    const value = 10 ** from.units[0].magnitude;
    const referenceValue = calculate(cvState, { from, to, value, date: referenceDate });
    const currentValue = calculate(cvState, { from, to, value });
    if (referenceValue && currentValue) {
      const change = meaningfulPercentage(currentValue - referenceValue, referenceValue);
      if (change) {
        list.push({
          currency: asset,
          change,
          currentValue,
          referenceValue,
        });
      }
    }
  }

  list.sort((a, b) => b.change - a.change);

  return list;
}
