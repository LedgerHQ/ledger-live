import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { createRateSource } from "./rateSource";
import { RateFetchError } from "./errors";
import type { HistoricalRatesArgs, RateQueryPromise, SpotRatesArgs } from "./types";

const btc = getCryptoCurrencyById("bitcoin");
const eth = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const eur = getFiatCurrencyByTicker("EUR");

const DAY = 24 * 60 * 60 * 1000;

/** Wraps a value as the envelope `dispatch(initiate(...))` resolves to. */
function resolved<T>(data: T, onUnsubscribe?: () => void): RateQueryPromise<T> {
  const p = Promise.resolve({ data }) as RateQueryPromise<T>;
  p.unsubscribe = onUnsubscribe;
  return p;
}

function failed<T>(
  error: { status: number | string },
  onUnsubscribe?: () => void,
): RateQueryPromise<T> {
  const p = Promise.resolve({ error }) as unknown as RateQueryPromise<T>;
  p.unsubscribe = onUnsubscribe;
  return p;
}

describe("fetchHistorical", () => {
  test("does not fetch the future", async () => {
    const fetchHistoricalWindow = jest.fn();
    const rates = createRateSource({ fetchHistoricalWindow, fetchSpotBatch: jest.fn() });

    const out = await rates.fetchHistorical("daily", {
      from: btc,
      to: usd,
      startDate: new Date(Date.now() + DAY),
    });

    expect(out).toEqual({});
    expect(fetchHistoricalWindow).not.toHaveBeenCalled();
  });

  test("does not fetch when the window collapses to a single stamp", async () => {
    const fetchHistoricalWindow = jest.fn();
    const rates = createRateSource({ fetchHistoricalWindow, fetchSpotBatch: jest.fn() });

    const out = await rates.fetchHistorical("daily", {
      from: btc,
      to: usd,
      startDate: new Date(),
    });

    expect(out).toEqual({});
    expect(fetchHistoricalWindow).not.toHaveBeenCalled();
  });

  test("resolves currencies to API ids and formats the window bounds", async () => {
    let seen: HistoricalRatesArgs | undefined;
    const rates = createRateSource({
      fetchHistoricalWindow: args => {
        seen = args;
        return resolved({ "2018-03-01": 9000 });
      },
      fetchSpotBatch: jest.fn(),
    });

    const out = await rates.fetchHistorical("daily", {
      from: btc,
      to: usd,
      startDate: new Date(Date.now() - 30 * DAY),
    });

    expect(out).toEqual({ "2018-03-01": 9000 });
    expect(seen?.granularity).toBe("daily");
    expect(seen?.from).toBe("bitcoin");
    expect(seen?.to).toBe("USD");
    expect(seen?.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(seen?.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("throws a RateFetchError carrying the status verbatim", async () => {
    const rates = createRateSource({
      fetchHistoricalWindow: () => failed({ status: 422 }),
      fetchSpotBatch: jest.fn(),
    });

    await expect(
      rates.fetchHistorical("daily", {
        from: btc,
        to: usd,
        startDate: new Date(Date.now() - 30 * DAY),
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  test("releases the subscription even when the request fails", async () => {
    const unsubscribe = jest.fn();
    const rates = createRateSource({
      fetchHistoricalWindow: () => failed({ status: 500 }, unsubscribe),
      fetchSpotBatch: jest.fn(),
    });

    await expect(
      rates.fetchHistorical("daily", {
        from: btc,
        to: usd,
        startDate: new Date(Date.now() - 30 * DAY),
      }),
    ).rejects.toBeInstanceOf(RateFetchError);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("fetchLatest", () => {
  test("returns an empty list without fetching", async () => {
    const fetchSpotBatch = jest.fn();
    const rates = createRateSource({ fetchHistoricalWindow: jest.fn(), fetchSpotBatch });

    expect(await rates.fetchLatest([])).toEqual([]);
    expect(fetchSpotBatch).not.toHaveBeenCalled();
  });

  test("batches pairs sharing a `to` into one request", async () => {
    const calls: SpotRatesArgs[] = [];
    const rates = createRateSource({
      fetchHistoricalWindow: jest.fn(),
      fetchSpotBatch: args => {
        calls.push(args);
        return resolved({ bitcoin: 9000, ethereum: 600 });
      },
    });

    const out = await rates.fetchLatest([
      { from: btc, to: usd, startDate: new Date() },
      { from: eth, to: usd, startDate: new Date() },
    ]);

    expect(calls).toEqual([{ to: "USD", froms: ["bitcoin", "ethereum"] }]);
    expect(out).toEqual([9000, 600]);
  });

  test("splits on a change of `to`", async () => {
    const calls: SpotRatesArgs[] = [];
    const rates = createRateSource({
      fetchHistoricalWindow: jest.fn(),
      fetchSpotBatch: args => {
        calls.push(args);
        return resolved(args.to === "USD" ? { bitcoin: 9000 } : { ethereum: 500 });
      },
    });

    const out = await rates.fetchLatest([
      { from: btc, to: usd, startDate: new Date() },
      { from: eth, to: eur, startDate: new Date() },
    ]);

    expect(calls).toHaveLength(2);
    expect(out).toEqual([9000, 500]);
  });

  test("requests a solver-excluded pair on its own", async () => {
    const calls: SpotRatesArgs[] = [];
    const rates = createRateSource({
      fetchHistoricalWindow: jest.fn(),
      fetchSpotBatch: args => {
        calls.push(args);
        return resolved({ bitcoin: 9000, ethereum: 600 });
      },
    });

    const out = await rates.fetchLatest(
      [
        { from: btc, to: usd, startDate: new Date() },
        { from: eth, to: usd, startDate: new Date() },
      ],
      { shouldBatchCurrencyFrom: currency => currency.ticker !== "ETH" },
    );

    expect(calls).toEqual([
      { to: "USD", froms: ["bitcoin"] },
      { to: "USD", froms: ["ethereum"] },
    ]);
    expect(out).toEqual([9000, 600]);
  });

  test("caps a batch at 50 `from` currencies", async () => {
    const pairs = Array.from({ length: 120 }, () => ({
      from: btc,
      to: usd,
      startDate: new Date(),
    }));
    const sizes: number[] = [];
    const rates = createRateSource({
      fetchHistoricalWindow: jest.fn(),
      fetchSpotBatch: args => {
        sizes.push(args.froms.length);
        return resolved({ bitcoin: 9000 });
      },
    });

    await rates.fetchLatest(pairs);

    expect(sizes).toEqual([50, 50, 20]);
  });

  test("reports a missing rate as 0, as the caller expects", async () => {
    const rates = createRateSource({
      fetchHistoricalWindow: jest.fn(),
      fetchSpotBatch: () => resolved({ bitcoin: 9000 }),
    });

    const out = await rates.fetchLatest([
      { from: btc, to: usd, startDate: new Date() },
      { from: eth, to: usd, startDate: new Date() },
    ]);

    expect(out).toEqual([9000, 0]);
  });

  test("releases every subscription it opens", async () => {
    const unsubscribe = jest.fn();
    const rates = createRateSource({
      fetchHistoricalWindow: jest.fn(),
      fetchSpotBatch: () => resolved({ bitcoin: 9000 }, unsubscribe),
    });

    await rates.fetchLatest([
      { from: btc, to: usd, startDate: new Date() },
      { from: eth, to: eur, startDate: new Date() },
    ]);

    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });
});
