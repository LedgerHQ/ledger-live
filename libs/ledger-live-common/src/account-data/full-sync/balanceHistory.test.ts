import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { startOfDay, startOfHour, startOfWeek } from "../../portfolio/ranges";
import { toAccountBalanceHistory } from "./balanceHistory";

const now = new Date("2026-03-15T10:30:00.000Z");
const tokenId = "ethereum/erc20/usd_tether__erc20_";

const account = (): Account => ({
  ...genAccount("balance-history", { currency: getCryptoCurrencyById("ethereum") }),
  balance: new BigNumber(1000),
  creationDate: now,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: { latestDate: startOfHour(now).getTime(), balances: [100, -5, 250.4] },
    DAY: { latestDate: startOfDay(now).getTime(), balances: [700] },
    WEEK: { latestDate: startOfWeek(now).getTime(), balances: [] },
  },
  subAccounts: [createFixtureTokenAccount("01")],
});

const balances = (points: { balance: string }[]) => points.map(point => point.balance);

beforeEach(() => jest.useFakeTimers({ now }));
afterEach(() => jest.useRealTimers());

describe("toAccountBalanceHistory", () => {
  it("answers one series per asset for the range, native coin first, then each token account", () => {
    const { range, series } = toAccountBalanceHistory(account(), { range: "week" });
    expect(range).toBe("week");
    expect(series.map(({ assetId }) => assetId)).toEqual(["ethereum", tokenId]);
    expect(series.map(({ points }) => points.length)).toEqual([7 * 24, 7 * 24]);
  });

  it("ends each series with the current balance, at the read date", () => {
    const [native, token] = toAccountBalanceHistory(account(), { range: "week" }).series;
    expect(native.points.at(-1)).toEqual({ date: now.toISOString(), balance: "1000" });
    expect(token.points.at(-1)).toEqual({
      date: now.toISOString(),
      balance: "51281813126095913",
    });
  });

  it("maps the cached balances of the range's granularity, oldest first, as integer amounts", () => {
    const [native] = toAccountBalanceHistory(account(), { range: "week" }).series;
    expect(balances(native.points.slice(-5))).toEqual(["0", "100", "0", "250", "1000"]);
  });

  it("dates every series alike, oldest first", () => {
    const [native, token] = toAccountBalanceHistory(account(), { range: "month" }).series;
    const dates = native.points.map(point => point.date);
    expect(token.points.map(point => point.date)).toEqual(dates);
    expect([...dates].sort()).toEqual(dates);
    expect(balances(native.points.slice(-2))).toEqual(["700", "1000"]);
  });

  it("reads the default range when the query names none", () => {
    const { range, series } = toAccountBalanceHistory(account(), undefined);
    expect(range).toBe("month");
    expect(series[0].points).toHaveLength(30);
  });

  it("covers the whole life of the account on the all range", () => {
    const old = { ...account(), creationDate: new Date("2024-03-15T00:00:00.000Z") };
    const [native, token] = toAccountBalanceHistory(old, { range: "all" }).series;
    expect(native.points.length).toBeGreaterThan(104);
    expect(token.points).toHaveLength(native.points.length);
  });

  it("answers the native coin alone for an account without token accounts", () => {
    const { series } = toAccountBalanceHistory(
      { ...account(), subAccounts: undefined },
      { range: "day" },
    );
    expect(series.map(({ assetId }) => assetId)).toEqual(["ethereum"]);
  });
});
