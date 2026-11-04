import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import { descriptorOf, sourceIdOf } from "@domain/api-account-data/testing";
import { CountervalueTickerSchema, type BalanceAssetId } from "@domain/entity-account-balance";
import type {
  AccountBalanceHistory,
  AccountBalanceHistoryQuery,
} from "@domain/entity-account-balance-history";
import { mockAssetBalanceHistory } from "@domain/entity-account-balance-history/schema.mock";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { importCountervalues } from "@domain/entity-market-countervalues";
import {
  valueBalanceHistory,
  withBalanceHistoryCountervalues,
} from "./withBalanceHistoryCountervalues";
import { withCountervalues } from "./withCountervalues";

const usd = CountervalueTickerSchema.parse("USD");
const eth = getCryptoCurrencyById("ethereum");
const usdt = mockTokenCurrency();
const currencies = new Map<string, Currency>([
  [eth.id, eth],
  [usdt.id, usdt],
]);
const currencyOf = (assetId: BalanceAssetId) => currencies.get(assetId);

const target: AccountTarget = {
  accountUUID: AccountUUIDSchema.parse("6ba7b810-9dad-51d1-80b4-00c04fd430c8"),
  descriptor: descriptorOf(0),
};

const ratesOf = (data: Record<string, Record<string, number>>) =>
  importCountervalues(
    { status: {}, ...data },
    { trackingPairs: [], autofillGaps: true, refreshRate: 60000, marketCapBatchingAfterRank: 20 },
  );

const ONE_ETH = "1000000000000000000";

const ethSeries = (date = "2026-01-01T00:00:00.000Z", countervalues?: Record<string, string>) =>
  mockAssetBalanceHistory({
    assetId: eth.id,
    points: [{ date, balance: ONE_ETH, ...(countervalues && { countervalues }) }],
  });

const historyOf = (...series: AccountBalanceHistory["series"]): AccountBalanceHistory => ({
  range: "week",
  series,
});

const valued = (history: AccountBalanceHistory, rates = ratesOf({})) =>
  valueBalanceHistory(history, usd, rates, currencyOf).series.map(series =>
    series.points.map(point => point.countervalues),
  );

describe("valueBalanceHistory", () => {
  it("values each point's balance in the fiat asked, at its date, when a rate is held", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000, "2026-01-02": 3000 } });
    const series = mockAssetBalanceHistory({
      assetId: eth.id,
      points: [
        { date: "2026-01-01T00:00:00.000Z", balance: ONE_ETH },
        { date: "2026-01-02T00:00:00.000Z", balance: "500000000000000000" },
      ],
    });
    expect(valued(historyOf(series), rates)).toEqual([[{ USD: "200000" }, { USD: "150000" }]]);
  });

  it("values a token series with the token's own rate, in the token's unit", () => {
    const rates = ratesOf({ [`USD ${usdt.id}`]: { "2026-01-01": 1 } });
    const token = mockAssetBalanceHistory({
      assetId: usdt.id,
      points: [{ date: "2026-01-01T00:00:00.000Z", balance: "2500000" }],
    });
    expect(valued(historyOf(token), rates)).toEqual([[{ USD: "250" }]]);
  });

  it("values a point at its day's rate, not the latest one", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 1000, latest: 2000 } });
    expect(valued(historyOf(ethSeries("2026-01-01T12:00:00.000Z")), rates)).toEqual([
      [{ USD: "100000" }],
    ]);
  });

  it("rounds the half cent up without floating point drift", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2459.305 } });
    expect(valued(historyOf(ethSeries()), rates)).toEqual([[{ USD: "245931" }]]);
  });

  it("values in Bitcoin with the rates held for the crypto currency", () => {
    const btc = CountervalueTickerSchema.parse("BTC");
    const rates = ratesOf({ "bitcoin ethereum": { "2026-01-01": 0.05 } });
    const history = valueBalanceHistory(historyOf(ethSeries()), btc, rates, currencyOf);
    expect(history.series[0]?.points[0]?.countervalues).toEqual({ BTC: "5000000" });
  });

  it.each([
    ["only a latest rate is held", { latest: 2000 }],
    ["the point predates the rate history", { "2026-02-01": 2000 }],
  ])("leaves a point unvalued when %s", (_, history) => {
    expect(valued(historyOf(ethSeries()), ratesOf({ "USD ethereum": history }))).toEqual([
      [undefined],
    ]);
  });

  it("keeps a value the source already gave", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000 } });
    expect(valued(historyOf(ethSeries(undefined, { USD: "1" })), rates)).toEqual([[{ USD: "1" }]]);
  });

  it("leaves a series of an unknown asset unvalued", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000 } });
    const unknown = mockAssetBalanceHistory({
      assetId: "unknown",
      points: [{ date: "2026-01-01T00:00:00.000Z", balance: "1" }],
    });
    expect(valued(historyOf(unknown), rates)).toEqual([[undefined]]);
  });

  it("leaves the history as is without a fiat, a known fiat or rates", () => {
    const history = historyOf(ethSeries());
    expect(valueBalanceHistory(history, undefined, ratesOf({}), currencyOf)).toBe(history);
    expect(valueBalanceHistory(history, usd, undefined, currencyOf)).toBe(history);
    const unknown = CountervalueTickerSchema.parse("XXX_UNKNOWN");
    expect(valueBalanceHistory(history, unknown, ratesOf({}), currencyOf)).toBe(history);
  });
});

const sourceWith = (parts: Partial<AccountDataSource>): AccountDataSource => ({
  id: sourceIdOf("test"),
  supports: () => true,
  ...parts,
});

describe("withBalanceHistoryCountervalues", () => {
  const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000 } });
  const host = {
    rates: () => rates,
    findCurrency: jest.fn(async (assetId: BalanceAssetId) => currencyOf(assetId)),
  };
  const query: AccountBalanceHistoryQuery = { range: "week", countervalue: usd };

  it("values the history a single reader returns, for the account read", async () => {
    const balanceHistory = jest.fn(async () => historyOf(ethSeries()));
    const balance = jest.fn();
    const source = withBalanceHistoryCountervalues(
      sourceWith({ read: { balanceHistory, balance } }),
      host,
    );
    expect(await source.read?.balanceHistory?.(target, query)).toEqual(
      historyOf(ethSeries(undefined, { USD: "200000" })),
    );
    expect(host.findCurrency).toHaveBeenCalledWith(eth.id);
    expect(source.read?.balance).toBe(balance);
  });

  it("values the fulfilled results of a batch reader and keeps the failures", async () => {
    const failure = new Error("down");
    const balanceHistory = jest.fn(
      async (): Promise<PromiseSettledResult<AccountBalanceHistory>[]> => [
        { status: "fulfilled", value: historyOf(ethSeries()) },
        { status: "rejected", reason: failure },
      ],
    );
    const source = withBalanceHistoryCountervalues(
      sourceWith({ readBatch: { balanceHistory } }),
      host,
    );
    expect(await source.readBatch?.balanceHistory?.([target, target], query)).toEqual([
      { status: "fulfilled", value: historyOf(ethSeries(undefined, { USD: "200000" })) },
      { status: "rejected", reason: failure },
    ]);
  });

  it("leaves the points unvalued when the currency lookup fails", async () => {
    const balanceHistory = jest.fn(async () => historyOf(ethSeries()));
    const failing = {
      ...host,
      findCurrency: jest.fn(async () => Promise.reject(new Error("CAL"))),
    };
    const source = withBalanceHistoryCountervalues(
      sourceWith({ read: { balanceHistory } }),
      failing,
    );
    expect(await source.read?.balanceHistory?.(target, query)).toEqual(historyOf(ethSeries()));
  });

  it("looks no currency up when the query asks for no fiat", async () => {
    const findCurrency = jest.fn();
    const balanceHistory = jest.fn(async () => historyOf(ethSeries()));
    const source = withBalanceHistoryCountervalues(sourceWith({ read: { balanceHistory } }), {
      ...host,
      findCurrency,
    });
    await source.read?.balanceHistory?.(target, { range: "week" });
    expect(findCurrency).not.toHaveBeenCalled();
  });

  it("returns a source without a balance history reader as is", () => {
    const source = sourceWith({ read: { balance: jest.fn() } });
    expect(withBalanceHistoryCountervalues(source, host)).toBe(source);
  });
});

describe("withCountervalues", () => {
  it("values both the operations and the balance histories of a source", async () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000 } });
    const host = { rates: () => rates, findCurrency: currencyOf };
    const balanceHistory = jest.fn(async () => historyOf(ethSeries()));
    const operations = jest.fn(async () => ({ operations: [] }));
    const source = withCountervalues(
      { id: sourceIdOf("test"), supports: () => true, read: { balanceHistory, operations } },
      host,
    );
    expect(
      await source.read?.balanceHistory?.(target, { range: "week", countervalue: usd }),
    ).toEqual(historyOf(ethSeries(undefined, { USD: "200000" })));
    expect(source.read?.operations).not.toBe(operations);
  });
});
