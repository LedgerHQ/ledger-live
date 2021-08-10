import "./test-helpers/staticTime";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "../currencies";
import {
  getDates,
  getBalanceHistory,
  getBalanceHistoryWithCountervalue,
  getPortfolio,
  getCurrencyPortfolio,
  getAssetsDistribution,
} from "../portfolio";
import type { Account } from "../types";
import { genAccount } from "../mock/account";
import { getBTCValues } from "../countervalues/mock";
const baseMockBTCRates = getBTCValues();
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
  expect(history.length).toBe(52);
  expect(history).toMatchSnapshot();
});
test("getDates matches getBalanceHistory dates", () => {
  const history = getBalanceHistory(genAccount("seed_2"), "year");
  const dates = getDates("year");
  expect(history.map((p) => p.date)).toMatchObject(dates);
});
test("getBalanceHistory last item is now and have an amount equals to account balance", () => {
  const account = genAccount("seed_3");
  const history = getBalanceHistory(account, "month");
  expect(history[history.length - 1].date).toMatchObject(new Date());
  expect(history[history.length - 1].value).toBe(account.balance);
  expect(history).toMatchSnapshot();
});
test("getBalanceHistoryWithCountervalue basic", () => {
  const account = genAccount("bro4", {
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "month");
  const cv = getBalanceHistoryWithCountervalue(
    account,
    "month",
    (c, value) => value
  );
  expect(cv.countervalueAvailable).toBe(true);
  // expect(
  //   cv.history.map((p) => ({ date: p.date, value: p.countervalue }))
  // ).toMatchObject(history);
  expect(
    cv.history.map((p) => ({
      date: p.date,
      value: p.value,
    }))
  ).toMatchObject(history);
});
test("getPortfolio works with one account and is identically to that account history", () => {
  const account = genAccount("seed_4", {
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "week");
  const portfolio = getPortfolio(
    [account],
    "week",
    (account, value) => value // using identity, at any time, 1 token = 1 USD
  );
  expect(portfolio.availableAccounts).toMatchObject([account]);
  expect(portfolio.balanceAvailable).toBe(true);
  expect(portfolio.balanceHistory).toMatchObject(history);
  expect(portfolio.balanceHistory).toMatchSnapshot();
});
test("getCurrencyPortfolio works with one account and is identically to that account history", () => {
  const account = genAccount("seed_4", {
    subAccountsCount: 0,
  });

  const calc = (account, value) => value.times(0.1);

  const { history } = getBalanceHistoryWithCountervalue(account, "week", calc);
  const accounts: Account[] = [account];
  const portfolio = getCurrencyPortfolio(accounts, "week", calc);
  expect(portfolio.countervalueAvailable).toBe(true);
  expect(portfolio.history).toMatchObject(history);
  expect(portfolio.history).toMatchSnapshot();
});
test("getBalanceHistoryWithCountervalue to have proper countervalues", () => {
  const account = genAccount("bro1", {
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "week");

  const calc = (account, value) => value.times(3);

  const cv = getBalanceHistoryWithCountervalue(account, "week", calc);
  expect(
    cv.history.map((p) => ({
      date: p.date,
      value: p.countervalue.div(3),
    }))
  ).toMatchObject(history);
});
test("getBalanceHistoryWithCountervalue is same as getPortfolio with one account", () => {
  const account = genAccount("bro2", {
    subAccountsCount: 0,
  });

  const calc = (account, value) => value.times(3);

  const cv = getBalanceHistoryWithCountervalue(account, "month", calc);
  const portfolio = getPortfolio([account], "month", calc);
  expect(
    cv.history.map((p) => ({
      date: p.date,
      value: p.countervalue,
    }))
  ).toMatchObject(portfolio.balanceHistory);
});
test("getPortfolio calculateCounterValue can returns missing countervalue", () => {
  const account = genAccount("seed_6", {
    currency: getCryptoCurrencyById("bitcoin"),
    subAccountsCount: 0,
  });
  const account2 = genAccount("seed_7", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "month");
  const portfolio = getPortfolio([account, account2], "month", (c, value) =>
    c.id === "bitcoin" ? value : null
  );
  expect(portfolio.balanceHistory).toMatchObject(history);
  expect(portfolio.balanceAvailable).toBe(true);
  expect(portfolio.unavailableCurrencies.length).toBe(1);
});
test("getPortfolio with twice same account will double the amounts", () => {
  const account = genAccount("seed_5", {
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "week");
  const allHistory = getPortfolio(
    [account, account],
    "week",
    (c, value) => value // using identity, at any time, 1 token = 1 USD
  );
  allHistory.balanceHistory.forEach((h, i) => {
    expect(h.value.toString()).toBe(history[i].value.times(2).toString());
  });
});
test("getCurrencyPortfolio with twice same account will double the amounts", () => {
  const account = genAccount("seed_5", {
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "week");
  const accounts: Account[] = [account, account];
  const allHistory = getCurrencyPortfolio(
    accounts,
    "week",
    (c, value) => value // using identity, at any time, 1 token = 1 USD
  );
  allHistory.history.forEach((h, i) => {
    expect(h.value.toString()).toBe(history[i].value.times(2).toString());
  });
});
test("getPortfolio calculateCounterValue is taken into account", () => {
  const account = genAccount("seed_6", {
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "month");
  const portfolio = getPortfolio([account, account], "month", (c, value) =>
    value.div(2)
  );
  expect(portfolio.balanceHistory).toMatchObject(history);
});
test("getCurrencyPortfolio calculateCounterValue is taken into account", () => {
  const account = genAccount("seed_6", {
    subAccountsCount: 0,
  });
  const { history } = getBalanceHistoryWithCountervalue(
    account,
    "month",
    (c, value) => value
  );
  const accounts: Account[] = [account, account];
  const portfolio = getCurrencyPortfolio(accounts, "month", (c, value) =>
    value.div(2)
  );
  expect(portfolio.history.map((h) => h.value.div(2).toString())).toMatchObject(
    history.map((h) => h.value.toString())
  );
  expect(portfolio.history.map((h) => h.countervalue.toString())).toMatchObject(
    history.map((h) => h.countervalue.toString())
  );
});
test("getPortfolio calculateCounterValue can returns missing countervalue", () => {
  const account = genAccount("seed_6", {
    currency: getCryptoCurrencyById("bitcoin"),
    subAccountsCount: 0,
  });
  const account2 = genAccount("seed_7", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "month");
  const portfolio = getPortfolio([account, account2], "month", (c, value) =>
    c.id === "bitcoin" ? value : null
  );
  expect(portfolio.balanceHistory).toMatchObject(history);
  expect(portfolio.balanceAvailable).toBe(true);
  expect(portfolio.unavailableCurrencies.length).toBe(1);
});
test("getCurrencyPortfolio calculateCounterValue can miss countervalue", () => {
  const account = genAccount("seed_6", {
    currency: getCryptoCurrencyById("bitcoin"),
    subAccountsCount: 0,
  });
  const account2 = genAccount("seed_7", {
    currency: getCryptoCurrencyById("bitcoin"),
    subAccountsCount: 0,
  });
  const history = getBalanceHistory(account, "month");
  const history2 = getBalanceHistory(account2, "month");
  const accs: Account[] = [account, account2];
  const portfolio = getCurrencyPortfolio(accs, "month", () => null);
  expect(portfolio.history).toMatchObject(
    history.map((p, i) => ({ ...p, value: p.value.plus(history2[i].value) }))
  );
  expect(portfolio.countervalueAvailable).toBe(false);
});
test("getPortfolio calculateCounterValue can complete fails", () => {
  const account = genAccount("seed_6", {
    subAccountsCount: 0,
  });
  const account2 = genAccount("seed_7", {
    subAccountsCount: 0,
  });
  const portfolio = getPortfolio([account, account2], "month", () => null);
  expect(portfolio.balanceAvailable).toBe(false);
});
test("getPortfolio with lot of accounts", () => {
  const portfolio = getPortfolio(
    accounts,
    "week",
    (c, value) => value // using identity, at any time, 1 token = 1 USD
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
  expect(assetsDistribution.showFirst).toBe(2);
  expect(
    assetsDistribution.list.reduce((sum, o) => sum + o.distribution, 0)
  ).toBeCloseTo(1);
  expect(
    assetsDistribution.list.map((o) => [
      o.currency.ticker,
      o.amount,
      o.countervalue,
      o.distribution,
    ])
  ).toMatchSnapshot();
});
test("getAssetsDistribution mult", () => {
  const calc = (currency, value) => {
    const rate = baseMockBTCRates[currency.ticker];
    if (rate) return value.times(rate);
  };

  for (let i = 0; i < accounts.length; i++) {
    const assetsDistribution = getAssetsDistribution(
      accounts.slice(0, i),
      calc
    );
    // identity cached by ref
    expect(getAssetsDistribution(accounts.slice(0, i), calc)).toBe(
      assetsDistribution
    );

    if (assetsDistribution.isAvailable) {
      expect(assetsDistribution.sum.toString()).toBe(
        assetsDistribution.list
          .reduce(
            (sum: BigNumber, o) => sum.plus(o.countervalue),
            new BigNumber(0)
          )
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
test("getPortfolio do not crash if range history have different size", () => {
  let account1 = genAccount("seed_8", {
    currency: getCryptoCurrencyById("bitcoin"),
  });
  let account2 = genAccount("seed_9", {
    currency: getCryptoCurrencyById("bitcoin"),
  });
  let account3 = genAccount("seed_10", {
    currency: getCryptoCurrencyById("bitcoin"),
  });
  const history1 = getBalanceHistory(account1, "month");
  const history2 = getBalanceHistory(account2, "month");

  const calc = (c, value) => value;

  getPortfolio([account1, account2, account3], "month", calc);
  account1 = {
    ...account1,
    balanceHistory: {
      month: history1.concat(history1),
      year: undefined,
      week: undefined,
      day: undefined,
    },
  };
  getPortfolio([account1, account2, account3], "month", calc);
  account2 = {
    ...account2,
    balanceHistory: {
      month: history2.slice(5),
      year: undefined,
      week: undefined,
      day: undefined,
    },
  };
  getPortfolio([account1, account2, account3], "month", calc);
  account3 = {
    ...account3,
    balanceHistory: {
      month: [],
      year: undefined,
      week: undefined,
      day: undefined,
    },
  };
  const portfolio = getPortfolio([account1, account2, account3], "month", calc);
  expect(portfolio.balanceAvailable).toBe(true);
  expect(portfolio.unavailableCurrencies.length).toBe(0);
});
