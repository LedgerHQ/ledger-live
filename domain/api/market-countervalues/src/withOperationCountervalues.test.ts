import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import { descriptorOf, sourceIdOf } from "@domain/api-account-data/testing";
import { CountervalueTickerSchema, type BalanceAssetId } from "@domain/entity-account-balance";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import type { AccountOperationsPage } from "@domain/entity-account-operation";
import { mockAccountOperation } from "@domain/entity-account-operation/schema.mock";
import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { importCountervalues } from "@domain/entity-market-countervalues";
import { valueOperations, withOperationCountervalues } from "./withOperationCountervalues";

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

const oneEth = (date = "2026-01-01T00:00:00.000Z", countervalues?: Record<string, string>) =>
  mockAccountOperation({
    id: "eth-op",
    assetId: eth.id,
    value: "1000000000000000000",
    date,
    countervalues,
  });

const pageOf = (...operations: AccountOperationsPage["operations"]): AccountOperationsPage => ({
  operations,
});

const valued = (page: AccountOperationsPage, rates = ratesOf({})) =>
  valueOperations(page, usd, rates, currencyOf).operations.map(row => row.countervalues);

describe("valueOperations", () => {
  it("values each row in the fiat asked, at its date, when a rate is held", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000 } });
    const token = mockAccountOperation({ id: "usdt-op", assetId: usdt.id, value: "10" });
    expect(valued(pageOf(oneEth(), token), rates)).toEqual([{ USD: "200000" }, undefined]);
  });

  it("values in Bitcoin with the rates held for the crypto currency", () => {
    const btc = CountervalueTickerSchema.parse("BTC");
    const rates = ratesOf({ "bitcoin ethereum": { "2026-01-01": 0.05 } });
    const [row] = valueOperations(pageOf(oneEth()), btc, rates, currencyOf).operations;
    expect(row?.countervalues).toEqual({ BTC: "5000000" });
  });

  it("values a token row with the token's own rate, in the token's unit", () => {
    const rates = ratesOf({ [`USD ${usdt.id}`]: { "2026-01-01": 1 } });
    const token = mockAccountOperation({ assetId: usdt.id, value: "2500000" });
    expect(valued(pageOf(token), rates)).toEqual([{ USD: "250" }]);
  });

  it("values a row at its day's rate, not the latest one", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 1000, latest: 2000 } });
    expect(valued(pageOf(oneEth("2026-01-01T12:00:00.000Z")), rates)).toEqual([{ USD: "100000" }]);
  });

  it("rounds the half cent up without floating point drift", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2459.305 } });
    expect(valued(pageOf(oneEth()), rates)).toEqual([{ USD: "245931" }]);
  });

  it.each([
    ["only a latest rate is held", { latest: 2000 }],
    ["the row predates the rate history", { "2026-02-01": 2000 }],
  ])("leaves a row unvalued when %s", (_, history) => {
    expect(valued(pageOf(oneEth()), ratesOf({ "USD ethereum": history }))).toEqual([undefined]);
  });

  it("keeps a value the source already gave", () => {
    const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000 } });
    const native = mockAccountOperation({ assetId: eth.id, countervalues: { USD: "1" } });
    expect(valued(pageOf(native), rates)).toEqual([{ USD: "1" }]);
  });

  it("leaves the page as is without a fiat, a known fiat or rates", () => {
    const page = pageOf(oneEth());
    expect(valueOperations(page, undefined, ratesOf({}), currencyOf)).toBe(page);
    expect(valueOperations(page, usd, undefined, currencyOf)).toBe(page);
    const unknown = CountervalueTickerSchema.parse("XXX_UNKNOWN");
    expect(valueOperations(page, unknown, ratesOf({}), currencyOf)).toBe(page);
  });
});

describe("withOperationCountervalues", () => {
  const rates = ratesOf({ "USD ethereum": { "2026-01-01": 2000 } });
  const host = {
    rates: () => rates,
    findCurrency: jest.fn(async (assetId: BalanceAssetId) => currencyOf(assetId)),
  };
  const sourceWith = (parts: Partial<AccountDataSource>): AccountDataSource => ({
    id: sourceIdOf("test"),
    supports: () => true,
    ...parts,
  });

  it("values the operations a single reader returns, for the account read", async () => {
    const operations = jest.fn(async () => pageOf(oneEth()));
    const balance = jest.fn();
    const source = withOperationCountervalues(sourceWith({ read: { operations, balance } }), host);
    const page = await source.read?.operations?.(target, { countervalue: usd });
    expect(page?.operations.map(row => row.countervalues)).toEqual([{ USD: "200000" }]);
    expect(host.findCurrency).toHaveBeenCalledWith(eth.id);
    expect(source.read?.balance).toBe(balance);
  });

  it("values the fulfilled results of a batch reader and keeps the failures", async () => {
    const failure = new Error("down");
    const operations = jest.fn(async (): Promise<PromiseSettledResult<AccountOperationsPage>[]> => [
      { status: "fulfilled", value: pageOf(oneEth()) },
      { status: "rejected", reason: failure },
    ]);
    const source = withOperationCountervalues(sourceWith({ readBatch: { operations } }), host);
    const results = await source.readBatch?.operations?.([target, target], { countervalue: usd });
    expect(results).toEqual([
      { status: "fulfilled", value: pageOf(oneEth(undefined, { USD: "200000" })) },
      { status: "rejected", reason: failure },
    ]);
  });

  it("leaves the rows unvalued when the currency lookup fails", async () => {
    const operations = jest.fn(async () => pageOf(oneEth()));
    const failing = {
      ...host,
      findCurrency: jest.fn(async () => Promise.reject(new Error("CAL"))),
    };
    const source = withOperationCountervalues(sourceWith({ read: { operations } }), failing);
    const page = await source.read?.operations?.(target, { countervalue: usd });
    expect(page).toEqual(pageOf(oneEth()));
  });

  it("looks no currency up when the query asks for no fiat", async () => {
    const findCurrency = jest.fn();
    const operations = jest.fn(async () => pageOf(oneEth()));
    const source = withOperationCountervalues(sourceWith({ read: { operations } }), {
      ...host,
      findCurrency,
    });
    await source.read?.operations?.(target, undefined);
    expect(findCurrency).not.toHaveBeenCalled();
  });

  it("keeps the batch readers of a source that reads its operations one by one", () => {
    const balance = jest.fn();
    const source = withOperationCountervalues(
      sourceWith({ read: { operations: jest.fn() }, readBatch: { balance } }),
      host,
    );
    expect(source.readBatch?.balance).toBe(balance);
  });

  it("keeps the single readers of a source that reads its operations in batches", () => {
    const balance = jest.fn();
    const source = withOperationCountervalues(
      sourceWith({ read: { balance }, readBatch: { operations: jest.fn() } }),
      host,
    );
    expect(source.read?.balance).toBe(balance);
  });

  it("returns a source without an operations reader as is", () => {
    const source = sourceWith({ read: { balance: jest.fn() } });
    expect(withOperationCountervalues(source, host)).toBe(source);
  });
});
