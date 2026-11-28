import type { AccountDataSource } from "@domain/api-account-data";
import type { AccountBalanceHistory } from "@domain/entity-account-balance-history";
import type { CryptoOrTokenCurrencyId, Currency } from "@domain/entity-currency";
import { findFiatCurrencyByTicker, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import { countervalueAt, currenciesOf, historicalRate } from "./internals/valuation";
import type { CountervaluesHost } from "./types";

/** Each point's balance valued in `ticker` at its date, unless it already is; a point without a rate has none. */
export function valueBalanceHistory(
  history: AccountBalanceHistory,
  ticker: FiatCurrencyTicker | undefined,
  rates: CounterValuesCacheView | undefined,
  currencyOf: (assetId: CryptoOrTokenCurrencyId) => Currency | undefined,
): AccountBalanceHistory {
  const to = ticker && findFiatCurrencyByTicker(ticker);
  if (!ticker || !to || !rates) return history;
  const series = history.series.map(each => {
    const from = currencyOf(each.assetId);
    if (!from) return each;
    return {
      ...each,
      points: each.points.map(point => {
        if (point.countervalues?.[ticker] !== undefined) return point;
        const rate = historicalRate(rates, from, to, new Date(point.date));
        if (!rate) return point;
        const countervalue = countervalueAt(point.balance, rate, from, to);
        return { ...point, countervalues: { ...point.countervalues, [ticker]: countervalue } };
      }),
    };
  });
  return { ...history, series };
}

/** The source, its balance histories valued in the fiat a query asks for when it does not value them itself. */
export function withBalanceHistoryCountervalues(
  source: AccountDataSource,
  host: CountervaluesHost,
): AccountDataSource {
  const read = source.read?.balanceHistory;
  const readBatch = source.readBatch?.balanceHistory;
  if (!read && !readBatch) return source;
  const valued = async (history: AccountBalanceHistory, ticker?: FiatCurrencyTicker) => {
    if (!ticker) return history;
    const currencyOf = await currenciesOf(
      assetId => host.findCurrency(assetId),
      history.series.map(series => series.assetId),
    );
    return valueBalanceHistory(history, ticker, host.rates(), currencyOf);
  };
  return {
    ...source,
    read: read
      ? {
          ...source.read,
          balanceHistory: async (target, query) =>
            valued(await read(target, query), query?.countervalue),
        }
      : source.read,
    readBatch: readBatch
      ? {
          ...source.readBatch,
          balanceHistory: async (targets, query) =>
            Promise.all(
              (await readBatch(targets, query)).map(async result =>
                result.status === "fulfilled"
                  ? { ...result, value: await valued(result.value, query?.countervalue) }
                  : result,
              ),
            ),
        }
      : source.readBatch,
  };
}
