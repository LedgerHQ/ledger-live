import type { AccountDataSource } from "@domain/api-account-data";
import type { AccountOperationsPage } from "@domain/entity-account-operation";
import type { CryptoOrTokenCurrencyId, Currency } from "@domain/entity-currency";
import { findFiatCurrencyByTicker, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import { countervalueAt, currenciesOf, historicalRate } from "./internals/valuation";
import type { CountervaluesHost } from "./types";

/** Each row valued in `ticker` at its date, unless it already is; a row without a rate has none. */
export function valueOperations(
  page: AccountOperationsPage,
  ticker: FiatCurrencyTicker | undefined,
  rates: CounterValuesCacheView | undefined,
  currencyOf: (assetId: CryptoOrTokenCurrencyId) => Currency | undefined,
): AccountOperationsPage {
  const to = ticker && findFiatCurrencyByTicker(ticker);
  if (!ticker || !to || !rates) return page;
  const operations = page.operations.map(row => {
    if (row.countervalues?.[ticker] !== undefined) return row;
    const from = currencyOf(row.assetId);
    const rate = from && historicalRate(rates, from, to, new Date(row.date));
    if (!from || !rate) return row;
    const countervalue = countervalueAt(row.value, rate, from, to);
    return { ...row, countervalues: { ...row.countervalues, [ticker]: countervalue } };
  });
  return { ...page, operations };
}

/** The source, its operations valued in the fiat a query asks for when it does not value them itself. */
export function withOperationCountervalues(
  source: AccountDataSource,
  host: CountervaluesHost,
): AccountDataSource {
  const read = source.read?.operations;
  const readBatch = source.readBatch?.operations;
  if (!read && !readBatch) return source;
  const valued = async (page: AccountOperationsPage, ticker?: FiatCurrencyTicker) => {
    if (!ticker) return page;
    const currencyOf = await currenciesOf(
      assetId => host.findCurrency(assetId),
      page.operations.map(row => row.assetId),
    );
    return valueOperations(page, ticker, host.rates(), currencyOf);
  };
  return {
    ...source,
    read: read
      ? {
          ...source.read,
          operations: async (target, query) =>
            valued(await read(target, query), query?.countervalue),
        }
      : source.read,
    readBatch: readBatch
      ? {
          ...source.readBatch,
          operations: async (targets, query) =>
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
