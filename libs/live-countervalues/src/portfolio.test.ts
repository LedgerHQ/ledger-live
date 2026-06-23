import "@ledgerhq/ledger-wallet-framework/test-helpers/staticTime";

import { getFiatCurrencyByTicker, getCryptoCurrencyById } from "./tests/currencies";
import { initialState, loadCountervalues, inferTrackingPairForAccounts } from "./logic";
import { pairId } from "./helpers";
import {
  getPortfolioCount,
  getBalanceHistory,
  getBalanceHistoryWithCountervalue,
  getPortfolio,
  getCurrencyPortfolio,
  getCurrentBalanceCountervalueChange,
  getAssetsDistribution,
  defaultAssetsDistribution,
  getPortfolioRangeConfig,
  getDates,
  getRanges,
  startOfHour,
  startOfDay,
  startOfWeek,
  orderAccountsByFiatValue,
} from "./portfolio";
import { setEnv } from "@ledgerhq/live-env";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, AccountLike, PortfolioRange } from "@ledgerhq/types-live";

setEnv("MOCK", "1");
setEnv("MOCK_COUNTERVALUES", "1");
describe("Portfolio", () => {
  const rangeCount: [PortfolioRange, number][] = [
    ["all", 52],
    ["year", 52],
    ["month", 30],
    ["week", 168],
    ["day", 24],
  ];
  describe("getPortfolioCount", () => {
    const accounts: AccountLike[] = Array.from({
      length: 100,
    }).map((_, j) => genAccount("portfolio_" + j));
    describe("default count", () => {
      rangeCount.forEach(([range, count]) => {
        it(`shoud return default count (${range})`, () => {
          const res = getPortfolioCount(accounts, range);
          expect(res).toBe(count);
        });
      });
    });
    describe("all time", () => {
      const range = "all";
      it("should return calculated count", () => {
        const accounts: AccountLike[] = [
          {
            ...genAccount("bitcoin_1"),
            creationDate: new Date("2008-10-31"), // Bitcoin paper issued
          },
        ];
        const res = getPortfolioCount(accounts, range);
        expect(res).toBe(491);
      });
      it("should return at least a year", () => {
        const res = getPortfolioCount(accounts, range);
        const count = getPortfolioRangeConfig("year").count;
        expect(res).toBe(count);
      });
    });
  });
  describe("getBalanceHistory", () => {
    const account = genAccount("account_1");
    describe("snapshots", () => {
      rangeCount.forEach(([range, count]) => {
        it("should match its prev snapshot", () => {
          const history = getBalanceHistory(account, range, count);
          expect(history).toMatchSnapshot();
        });
      });
    });
    it("should return history with length specified with count arg", () => {
      const [[range, count]] = rangeCount;
      const history = getBalanceHistory(account, range, count);
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(count);
    });
    it("should have dates matche getDates", () => {
      const [, [range, count]] = rangeCount;
      const history = getBalanceHistory(account, range, count);
      const dates = getDates(range, count);
      expect(history.map(p => p.date)).toMatchObject(dates);
    });
  });
  describe("getBalanceHistoryWithCountervalue", () => {
    const account = genAccountBitcoin();
    const [range, count] = rangeCount[1];
    test("coutnervalueAvailable should be false when the latest countervalue does NOT exists", async () => {
      const { to } = await loadCV(account);
      const state = { ...initialState, data: {} };
      const cv = getBalanceHistoryWithCountervalue(account, range, count, state, to);
      expect(cv.countervalueAvailable).toBe(false);
    });
    it("should return same value as history", async () => {
      const { state, to } = await loadCV(account);
      const cv = getBalanceHistoryWithCountervalue(account, range, count, state, to);
      const history = getBalanceHistory(account, range, count);
      expect(cv.countervalueAvailable).toBe(true);
      expect(
        cv.history.map(p => ({
          date: p.date,
          value: p.value,
        })),
      ).toMatchObject(history);
    });
    test("snapshot", async () => {
      const { state, to } = await loadCV(account);
      const cv = getBalanceHistoryWithCountervalue(account, range, count, state, to);
      expect(cv).toMatchSnapshot();
    });
  });
  describe("getPortfolio", () => {
    const account = genAccountBitcoin();
    const [range, count] = rangeCount[3];
    it("should return account as avilableAccounts when balanceAvailable is ture", async () => {
      const { state, to } = await loadCV(account);
      const portfolio = getPortfolio([account], range, state, to);
      expect(portfolio.balanceAvailable).toBe(true);
      expect(portfolio.availableAccounts).toMatchObject([account]);
    });
    test("balanceAvailable should be false and return as unavilableCurrenccies when the latest countervalue does NOT exists", async () => {
      const { to } = await loadCV(account);
      const state = { ...initialState, data: {} };
      const portfolio = getPortfolio([account], range, state, to);
      expect(portfolio.unavailableCurrencies).toMatchObject([getAccountCurrency(account)]);
      expect(portfolio.balanceAvailable).toBe(false);
    });
    test("balanceAvailable should be true when the only account is empty (no rate to fetch)", () => {
      const to = getFiatCurrencyByTicker("USD");
      const zero = account.balance.minus(account.balance);
      const emptyAccount: Account = {
        ...account,
        balance: zero,
        spendableBalance: zero,
        operationsCount: 0,
        operations: [],
        subAccounts: [],
      };
      const state = { ...initialState, data: {} };
      const portfolio = getPortfolio([emptyAccount], range, state, to);
      expect(portfolio.balanceAvailable).toBe(true);
    });
    test("balanceAvailable should be false when a non-empty account is still unpriced", () => {
      const to = getFiatCurrencyByTicker("USD");
      const zero = account.balance.minus(account.balance);
      const emptyAccount: Account = {
        ...account,
        balance: zero,
        spendableBalance: zero,
        operationsCount: 0,
        operations: [],
        subAccounts: [],
      };
      const nonEmptyUnpriced = genAccountBitcoin("bitcoin_2");
      const state = { ...initialState, data: {} };
      const portfolio = getPortfolio([emptyAccount, nonEmptyUnpriced], range, state, to);
      expect(portfolio.balanceAvailable).toBe(false);
    });
    it("should have history identical to the account history", async () => {
      const account2 = genAccountBitcoin("bitcoin_2");
      const { state, to } = await loadCV(account);
      const portfolio = getPortfolio([account, account2], range, state, to);
      const { history } = getBalanceHistoryWithCountervalue(account, range, count, state, to);
      const { history: history2 } = getBalanceHistoryWithCountervalue(
        account2,
        range,
        count,
        state,
        to,
      );
      expect(portfolio.histories).toMatchObject([history, history2]);
    });
    it("should recompose partial cache", async () => {
      const account = genAccountBitcoin("bitcoin_whatever");
      const { state, to } = await loadCV(account);
      const { history } = getBalanceHistoryWithCountervalue(account, "month", 100, state, to);
      const { latestDate, balances } = account.balanceHistoryCache.DAY;
      account.balanceHistoryCache.DAY = {
        latestDate: (latestDate || 0) - 24 * 1000 * 60 * 60,
        balances: balances.slice(0, balances.length - 2),
      };
      const { history: history2 } = getBalanceHistoryWithCountervalue(
        account,
        "month",
        100,
        state,
        to,
      );
      expect(history).toMatchObject(history2);
    });
    it("should double the amounts with twice the same account", async () => {
      const { state, to } = await loadCV(account);
      const portfolio = getPortfolio([account, account], range, state, to);
      const { history } = getBalanceHistoryWithCountervalue(account, range, count, state, to);
      portfolio.balanceHistory.forEach((h, i) => {
        expect(h.value).toBe((history[i].countervalue ?? 0) * 2);
      });
    });
    it("snapshot", async () => {
      const { state, to } = await loadCV(account);
      const portfolio = getPortfolio([account], range, state, to);
      expect(portfolio).toMatchSnapshot();
    });
  });
  describe("getCurrencyPortfolio", () => {
    const account = genAccountBitcoin();
    const [range, count] = rangeCount[3];
    it("should return accounts when balanceAvailable is ture", async () => {
      const { state, to } = await loadCV(account);
      const portfolio = getCurrencyPortfolio([account], range, state, to);
      expect(portfolio.countervalueAvailable).toBe(true);
      expect(portfolio.accounts).toMatchObject([account]);
    });
    test("countervalueAvailable should be false when the latest countervalue does NOT exists", async () => {
      const { to } = await loadCV(account);
      const state = { ...initialState, data: {} };
      const portfolio = getCurrencyPortfolio([account], range, state, to);
      expect(portfolio.countervalueAvailable).toBe(false);
    });
    it("should have history identical to the account history", async () => {
      const account2 = genAccountBitcoin("bitcoin_2");
      const { state, to } = await loadCV(account);
      const portfolio = getCurrencyPortfolio([account, account2], range, state, to);
      const { history } = getBalanceHistoryWithCountervalue(account, range, count, state, to);
      const { history: history2 } = getBalanceHistoryWithCountervalue(
        account2,
        range,
        count,
        state,
        to,
      );
      expect(portfolio.histories).toMatchObject([history, history2]);
    });
    it("should double the amounts with twice the same account", async () => {
      const { state, to } = await loadCV(account);
      const portfolio = getCurrencyPortfolio([account, account], range, state, to);
      const { history } = getBalanceHistoryWithCountervalue(account, range, count, state, to);
      portfolio.history.forEach((h, i) => {
        expect(h.countervalue).toBe((history[i].countervalue ?? 0) * 2);
      });
    });
    it("snapshot", async () => {
      const { state, to } = await loadCV(account);
      const portfolio = getCurrencyPortfolio([account], range, state, to);
      expect(portfolio).toMatchSnapshot();
    });
  });
  describe("getCurrentBalanceCountervalueChange", () => {
    const range: PortfolioRange = "day";
    // Builds an account whose hourly balance history is flat (= current balance) over the range,
    // so getCurrencyPortfolio (historical balance) reduces to the same price-only change.
    function genFlatBalanceAccount(id = "bitcoin_1"): Account {
      const account = genAccountBitcoin(id);
      const balance = account.balance.toNumber();
      return {
        ...account,
        balanceHistoryCache: {
          ...account.balanceHistoryCache,
          HOUR: {
            latestDate: startOfHour(new Date()).getTime(),
            balances: new Array(8 * 24).fill(balance),
          },
        },
      };
    }

    it("returns a neutral change for an empty accounts list", () => {
      const to = getFiatCurrencyByTicker("USD");
      const state = { ...initialState, data: {} };
      expect(getCurrentBalanceCountervalueChange([], range, state, to)).toEqual({
        value: 0,
        percentage: null,
      });
    });
    it("returns no percentage when no rate is available for the past date", async () => {
      const account = genAccountBitcoin();
      const { to } = await loadCV(account);
      const state = { ...initialState, data: {} };
      const change = getCurrentBalanceCountervalueChange([account], range, state, to);
      expect(change.value).toBe(0);
      expect(change.percentage).toBeFalsy();
    });
    it("matches the portfolio change when the balance is constant over the range", async () => {
      const account = genFlatBalanceAccount();
      const { state, to } = await loadCV(account);
      const portfolio = getCurrencyPortfolio([account], range, state, to);
      const change = getCurrentBalanceCountervalueChange([account], range, state, to);
      expect(typeof change.percentage).toBe("number");
      expect(change.percentage).toBeCloseTo(portfolio.countervalueChange.percentage as number, 4);
    });
    it("is balance-independent (percentage unchanged when the balance scales)", async () => {
      const account = genAccountBitcoin();
      const { state, to } = await loadCV(account);
      const single = getCurrentBalanceCountervalueChange([account], range, state, to);
      const doubled = getCurrentBalanceCountervalueChange([account, account], range, state, to);
      expect(doubled.percentage).toBeCloseTo(single.percentage as number, 8);
    });

    // Builds a state where the "now" rate comes from "latest" and the "then" rate from the fallback,
    // so both endpoints can be controlled independently for the edge cases below.
    function stateWithRates({ now, then }: { now?: number; then?: number }) {
      const from = getCryptoCurrencyById("bitcoin");
      const to = getFiatCurrencyByTicker("USD");
      const map = new Map<string, number>();
      if (now !== undefined) map.set("latest", now);
      return {
        ...initialState,
        data: {},
        cache: {
          [pairId({ from, to })]: {
            map,
            fallback: then,
            stats: {
              oldest: null,
              earliest: null,
              oldestDate: null,
              earliestDate: null,
              earliestStableDate: null,
            },
          },
        },
      };
    }

    it("returns a 0% change when the price is flat over the range", () => {
      const account = genAccountBitcoin();
      const to = getFiatCurrencyByTicker("USD");
      const state = stateWithRates({ now: 100, then: 100 });
      const change = getCurrentBalanceCountervalueChange([account], range, state, to);
      expect(change.value).toBe(0);
      expect(change.percentage).toBe(0);
    });

    it("returns a neutral change for a zero current balance even when rates are available", () => {
      const account = genAccountBitcoin();
      const zeroBalance = account.balance.minus(account.balance);
      const emptyAccount = {
        ...account,
        balance: zeroBalance,
        spendableBalance: zeroBalance,
      };
      const to = getFiatCurrencyByTicker("USD");
      const state = stateWithRates({ now: 100, then: 80 });
      const change = getCurrentBalanceCountervalueChange([emptyAccount], range, state, to);
      expect(change).toEqual({ value: 0, percentage: null });
    });

    it("returns a neutral change when the past rate is missing", () => {
      const account = genAccountBitcoin();
      const to = getFiatCurrencyByTicker("USD");
      const state = stateWithRates({ now: 100, then: undefined });
      const change = getCurrentBalanceCountervalueChange([account], range, state, to);
      expect(change).toEqual({ value: 0, percentage: null });
    });

    it("returns a neutral change when the current rate is missing", () => {
      const account = genAccountBitcoin();
      const to = getFiatCurrencyByTicker("USD");
      const state = stateWithRates({ now: undefined, then: 100 });
      const change = getCurrentBalanceCountervalueChange([account], range, state, to);
      expect(change).toEqual({ value: 0, percentage: null });
    });
  });

  describe("getAssetsDistribution", () => {
    it("snapshot", async () => {
      const account = genAccountBitcoin();
      const { state, to } = await loadCV(account);
      const assets = getAssetsDistribution([account], state, to);
      expect(assets).toMatchSnapshot();
    });

    it("should include an asset with a countervalue of 0 in the distribution", async () => {
      const account = genAccountBitcoin();
      const { state, to } = await loadCV(account);

      const zeroBalance = account.balance.minus(account.balance);
      const zeroBalanceAccount: Account = {
        ...account,
        balance: zeroBalance,
        spendableBalance: zeroBalance,
      };

      const assets = getAssetsDistribution([zeroBalanceAccount], state, to, {
        ...defaultAssetsDistribution,
        showEmptyAccounts: true,
      });

      expect(assets.isAvailable).toBe(true);
      expect(assets.list.length).toBeGreaterThan(0);

      const btcEntry = assets.list.find(a => a.currency.id === "bitcoin");
      expect(btcEntry).toBeDefined();
      expect(btcEntry!.countervalue).toBe(0);
      expect(assets.sum).toBe(0);
    });
  });

  describe("range module", () => {
    test("getRanges", () => {
      const ranges = ["all", "year", "month", "week", "day"];
      const res = getRanges();
      res.forEach(r => {
        const match = ranges.includes(r);
        expect(match).toBe(true);
      });
    });
  });
});

describe("date utils", () => {
  describe("startOfHour", () => {
    test("basic test", () => {
      expect(startOfHour(new Date(1655827384305)).toISOString()).toBe("2022-06-21T16:00:00.000Z");
    });
  });
  describe("startOfDay", () => {
    test("basic test", () => {
      expect(startOfDay(new Date(1655827384305)).toISOString()).toBe("2022-06-21T04:00:00.000Z");
    });
  });
  describe("startOfWeek", () => {
    test("basic test", () => {
      expect(startOfWeek(new Date(1655827384305)).toISOString()).toBe("2022-06-19T04:00:00.000Z");
    });
  });
  describe("getPortfolioRangeConfig", () => {
    test("returns a value for day", () => {
      expect(getPortfolioRangeConfig("day")).toBeDefined();
    });
    test("returns a value for week", () => {
      expect(getPortfolioRangeConfig("week")).toBeDefined();
    });
    test("returns a value for month", () => {
      expect(getPortfolioRangeConfig("month")).toBeDefined();
    });
  });
  describe("getDates", () => {
    test("day returns an array of asked size", () => {
      expect(getDates("day", 100).length).toEqual(100);
    });
    test("week returns an array of asked size", () => {
      expect(getDates("week", 100).length).toEqual(100);
    });
    test("month returns an array of asked size", () => {
      expect(getDates("month", 100).length).toEqual(100);
    });
  });
  describe("getRanges", () => {
    test("returns a non empty array", () => {
      expect(getRanges().length).toBeGreaterThan(0);
    });
  });
  describe("orderAccountsByFiatValue", () => {
    test("should return accounts ordered by fiat value", async () => {
      const account1 = genAccountBitcoin("bitcoin_1");
      const account2 = genAccountBitcoin("bitcoin_2");
      const { state, to } = await loadCV([account1, account2]);
      const accounts = [account1, account2];
      const orderedAccounts = orderAccountsByFiatValue(accounts, state, to);
      expect(orderedAccounts).toMatchObject([account2, account1]);
    });
  });
});

function genAccountBitcoin(id = "bitcoin_1") {
  return genAccount(id, {
    currency: getCryptoCurrencyById("bitcoin"),
  });
}

async function loadCV(a: Account | Account[], cvTicker = "USD") {
  const to = getFiatCurrencyByTicker(cvTicker);
  const accounts = Array.isArray(a) ? a : [a];
  const state = await loadCountervalues(initialState, {
    trackingPairs: inferTrackingPairForAccounts(accounts, to),
    autofillGaps: true,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  return {
    state,
    to,
  };
}
