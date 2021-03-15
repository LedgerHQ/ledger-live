// @flow
import "./test-helpers/staticTime";
import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
} from "@ledgerhq/cryptoassets";
import { initialState, loadCountervalues } from "../countervalues/logic";
import {
  getPortfolioCount,
  getBalanceHistory,
  getBalanceHistoryWithCountervalue,
  getPortfolio,
} from "../portfolio/v2";
import { getPortfolioRangeConfig, getDates } from "../portfolio/v2/range";
import type { AccountLike } from "../types";
import { genAccount } from "../mock/account";
import { getAccountCurrency } from "../account";
import { referenceSnapshotDate } from "../countervalues/mock";

jest
  .spyOn(Date, "now")
  .mockImplementation(() => new Date(referenceSnapshotDate).getTime());

describe("Portfolio", () => {
  describe("getPortfolioCount", () => {
    const accounts: AccountLike[] = Array.from({ length: 100 }).map((_, j) =>
      genAccount("portfolio_" + j)
    );
    describe("default count", () => {
      ["year", "month", "week", "day"].forEach((range) => {
        it(`shoud return default count (${range})`, () => {
          const res = getPortfolioCount(accounts, range);
          const count = getPortfolioRangeConfig(range).count;
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
        expect(res).toBe(601);
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

    it("should return history of 52 items with all time range", () => {
      const history = getBalanceHistory(account, "all", 52);
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(52);
      expect(history).toMatchSnapshot();
    });

    it("should return history of 52 items with year range", () => {
      const history = getBalanceHistory(account, "year", 52);
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(52);
      expect(history).toMatchSnapshot();
    });

    it("should return history of 30 items with month range", () => {
      const history = getBalanceHistory(account, "month", 30);
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(30);
      expect(history).toMatchSnapshot();
    });

    it("should return history of 168(7 * 24) items with week range", () => {
      const history = getBalanceHistory(account, "week", 52);
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(52);
      expect(history).toMatchSnapshot();
    });

    it("should return history of 168 items with day range", () => {
      const history = getBalanceHistory(account, "day", 24);
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(24);
      expect(history).toMatchSnapshot();
    });

    it("should have dates matche getDates", () => {
      const history = getBalanceHistory(account, "year", 52);
      const dates = getDates("year", 52);
      expect(history.map((p) => p.date)).toMatchObject(dates);
    });
  });

  describe("getBalanceHistoryWithCountervalue", () => {
    it("should return same value as history", async () => {
      const account = genAccountBitcoin();
      const range = "day";
      const history = getBalanceHistory(account, range, 24);
      const { state, to } = await loadCV(account);
      const cv = getBalanceHistoryWithCountervalue(
        account,
        range,
        24,
        state,
        to
      );
      expect(cv.countervalueAvailable).toBe(true);
      // TODO Portfolio: 🤔
      // expect(
      //   cv.history.map((p) => ({ date: p.date, value: p.countervalue }))
      // ).toMatchObject(history);
      expect(
        cv.history.map((p) => ({ date: p.date, value: p.value }))
      ).toMatchObject(history);
      expect(cv).toMatchSnapshot();
    });
  });

  describe("getPortfolio", () => {
    it("should work with one account and is identically to that account history", async () => {
      const account = genAccountBitcoin();
      const range = "week";
      const { state, to } = await loadCV(account);
      const portfolio = getPortfolio([account], range, state, to);
      expect(portfolio.availableAccounts).toMatchObject([account]);
      expect(portfolio.balanceAvailable).toBe(true);
      expect(portfolio.balanceHistory).toMatchSnapshot();
    });
  });

  describe("getCurrencyPortfolio", () => {});

  describe("getAssetsDistribution", () => {});
});

function genAccountBitcoin(id: string = "bitcoin_1") {
  return genAccount(id, { currency: getCryptoCurrencyById("bitcoin") });
}

async function loadCV(account: AccountLike) {
  const from = getAccountCurrency(account);
  const to = getFiatCurrencyByTicker("USD");
  const state = await loadCountervalues(initialState, {
    trackingPairs: [{ from, to }],
    autofillGaps: true,
  });
  return { state, from, to };
}
