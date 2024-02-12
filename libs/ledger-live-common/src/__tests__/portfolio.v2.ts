import "./test-helpers/staticTime";
import { getFiatCurrencyByTicker, getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import {
  initialState,
  loadCountervalues,
  inferTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues/logic";
import {
  getPortfolioCount,
  getBalanceHistory,
  getBalanceHistoryWithCountervalue,
  getPortfolio,
  getCurrencyPortfolio,
  getAssetsDistribution,
  getPortfolioRangeConfig,
  getDates,
  getRanges,
  startOfHour,
  startOfDay,
  startOfWeek,
} from "../portfolio/v2";
import { setEnv } from "@ledgerhq/live-env";
import { genAccount } from "../mock/account";
import { getAccountCurrency } from "../account";
import type { Account, AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import { setSupportedCurrencies } from "../currencies";
setSupportedCurrencies(["ethereum", "ethereum_classic", "ripple"]);

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
    it("should have history identical to the account history", async () => {
      const account2 = genAccountBitcoin("bitcoin_2");
      const { state, to } = await loadCV(account);
      const portfolio = getPortfolio([account, account2], range, state, to);
      const { history: history } = getBalanceHistoryWithCountervalue(
        account,
        range,
        count,
        state,
        to,
      );
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
      const { history: history } = getBalanceHistoryWithCountervalue(
        account,
        "month",
        100,
        state,
        to,
      );
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
      const { history: history } = getBalanceHistoryWithCountervalue(
        account,
        range,
        count,
        state,
        to,
      );
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
  describe("getAssetsDistribution", () => {
    it("snapshot", async () => {
      const account = genAccountBitcoin();
      const { state, to } = await loadCV(account);
      const assets = getAssetsDistribution([account], state, to);
      expect(assets).toMatchSnapshot();
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
  });
  return {
    state,
    to,
  };
}
