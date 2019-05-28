// @flow
import flatMap from "lodash/flatMap";
import { BigNumber } from "bignumber.js";
import { getFiatCurrencyByTicker } from "../currencies";
import {
  getDates,
  getBalanceHistory,
  getBalanceHistoryWithCountervalue,
  getPortfolio,
  getAssetsDistribution
} from "../portfolio";
import { genAccount } from "../mock/account";
import { baseMockBTCRates } from "../countervalues/mock";

const accounts = Array(100)
  .fill(null)
  .map((_, j) => genAccount("portfolio_" + j));

test("getBalanceHistory(*,month) returns an array of 30 items", () => {
  const history = getBalanceHistory(genAccount("seed_1"), "month");
  expect(history).toBeInstanceOf(Array);
  expect(history.length).toBe(30);
  expect(history).toMatchSnapshot();
});

test("getBalanceHistory(*,year) works as well", () => {
  const history = getBalanceHistory(genAccount("seed_2"), "year");
  expect(history).toBeInstanceOf(Array);
  expect(history.length).toBe(365);
  expect(history).toMatchSnapshot();
});

test("getDates matches getBalanceHistory dates", () => {
  const history = getBalanceHistory(genAccount("seed_2"), "year");
  const dates = getDates("year");
  expect(history.map(p => p.date)).toMatchObject(dates);
});

test("getBalanceHistory last item is now and have an amount equals to account balance", () => {
  const account = genAccount("seed_3");
  const history = getBalanceHistory(account, "month");
  expect(history[history.length - 1].date).toMatchObject(new Date());
  expect(history[history.length - 1].value).toBe(account.balance);
  expect(history).toMatchSnapshot();
});

test("getBalanceHistoryWithCountervalue basic", () => {
  const account = genAccount("bro4");
  const history = getBalanceHistory(account, "month");
  const cv = getBalanceHistoryWithCountervalue(
    account,
    "month",
    (account, value, date) => value
  );
  expect(cv.countervalueAvailable).toBe(true);
  expect(
    cv.history.map(p => ({ date: p.date, value: p.countervalue }))
  ).toMatchObject(history);
  expect(cv.history.map(p => ({ date: p.date, value: p.value }))).toMatchObject(
    history
  );
});

test("getPortfolio works with one account and is identically to that account history", () => {
  const account = genAccount("seed_4");
  const history = getBalanceHistory(account, "week");
  const portfolio = getPortfolio(
    [account],
    "week",
    (account, value, date) => value // using identity, at any time, 1 token = 1 USD
  );
  expect(portfolio.availableAccounts).toMatchObject([account]);
  expect(portfolio.balanceAvailable).toBe(true);
  expect(portfolio.balanceHistory).toMatchObject(history);
  expect(portfolio.balanceHistory).toMatchSnapshot();
});

test("getBalanceHistoryWithCountervalue to have proper countervalues", () => {
  const account = genAccount("bro1");
  const history = getBalanceHistory(account, "week");
  const calc = (account, value, date) => value.times(3);
  const cv = getBalanceHistoryWithCountervalue(account, "week", calc);
  expect(
    cv.history.map(p => ({ date: p.date, value: p.countervalue.div(3) }))
  ).toMatchObject(history);
});

test("getBalanceHistoryWithCountervalue is same as getPortfolio with one account", () => {
  const account = genAccount("bro2");
  const calc = (account, value, date) => value.times(3);
  const cv = getBalanceHistoryWithCountervalue(account, "month", calc);
  const portfolio = getPortfolio([account], "month", calc);
  expect(
    cv.history.map(p => ({ date: p.date, value: p.countervalue }))
  ).toMatchObject(portfolio.balanceHistory);
});

test("getPortfolio calculateCounterValue can returns missing countervalue", () => {
  const account = genAccount("seed_6");
  const account2 = genAccount("seed_7");
  const history = getBalanceHistory(account, "month");
  const portfolio = getPortfolio(
    [account, account2],
    "month",
    (a, value, date) => (a === account ? value : null)
  );
  expect(portfolio.balanceHistory).toMatchObject(history);
  expect(portfolio.balanceAvailable).toBe(true);
  expect(portfolio.unavailableCurrencies.length).toBe(1);
});

test("getPortfolio with twice same account will double the amounts", () => {
  const account = genAccount("seed_5");
  const history = getBalanceHistory(account, "week");
  const allHistory = getPortfolio(
    [account, account],
    "week",
    (account, value, date) => value // using identity, at any time, 1 token = 1 USD
  );
  allHistory.balanceHistory.forEach((h, i) => {
    expect(h.value.toString()).toBe(history[i].value.times(2).toString());
  });
});

test("getPortfolio calculateCounterValue is taken into account", () => {
  const account = genAccount("seed_6");
  const history = getBalanceHistory(account, "month");
  const portfolio = getPortfolio(
    [account, account],
    "month",
    (account, value, date) => value.div(2)
  );
  expect(portfolio.balanceHistory).toMatchObject(history);
});

test("getPortfolio calculateCounterValue can returns missing countervalue", () => {
  const account = genAccount("seed_6");
  const account2 = genAccount("seed_7");
  const history = getBalanceHistory(account, "month");
  const portfolio = getPortfolio(
    [account, account2],
    "month",
    (a, value, date) => (a === account ? value : null)
  );
  expect(portfolio.balanceHistory).toMatchObject(history);
  expect(portfolio.balanceAvailable).toBe(true);
  expect(portfolio.unavailableCurrencies.length).toBe(1);
});

test("getPortfolio calculateCounterValue can complete fails", () => {
  const account = genAccount("seed_6");
  const account2 = genAccount("seed_7");
  const portfolio = getPortfolio(
    [account, account2],
    "month",
    (a, value, date) => null
  );
  expect(portfolio.balanceAvailable).toBe(false);
});

test("getPortfolio with lot of accounts", () => {
  const portfolio = getPortfolio(
    accounts,
    "week",
    (account, value, date) => value // using identity, at any time, 1 token = 1 USD
  );
  expect(portfolio.balanceHistory).toMatchSnapshot();
});

test("getAssetsDistribution 1", () => {
  const assetsDistribution = getAssetsDistribution(
    accounts,
    (currency, value) => {
      const rate = baseMockBTCRates[currency.ticker];
      if (rate) return value.times(rate);
    }
  );
  expect(assetsDistribution.isAvailable).toBe(true);
  expect(assetsDistribution.showFirst).toBe(6);
  expect(
    assetsDistribution.list.reduce((sum, o) => sum + o.distribution, 0)
  ).toBeCloseTo(1);
  expect(
    assetsDistribution.list.map(o => [
      o.currency.ticker,
      o.amount,
      o.countervalue,
      o.distribution
    ])
  ).toMatchSnapshot();
});

test("getAssetsDistribution mult", () => {
  for (let i = 0; i < accounts.length; i++) {
    const assetsDistribution = getAssetsDistribution(
      accounts.slice(0, i),
      (currency, value) => {
        const rate = baseMockBTCRates[currency.ticker];
        if (rate) return value.times(rate);
      }
    );
    if (assetsDistribution.isAvailable) {
      expect(assetsDistribution.sum.toString()).toBe(
        assetsDistribution.list
          .reduce((sum, o) => sum.plus(o.countervalue), BigNumber(0))
          .toString()
      );
      expect(assetsDistribution.showFirst).toBeLessThanOrEqual(
        assetsDistribution.list.length
      );
      expect(
        assetsDistribution.list.reduce((sum, o) => sum + o.distribution, 0)
      ).toBeCloseTo(1);
    } else {
      expect(assetsDistribution.list.length).toBe(0);
    }
  }
});
