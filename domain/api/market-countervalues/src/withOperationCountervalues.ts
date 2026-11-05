import { BigNumber } from "bignumber.js";
import type { AccountDataSource } from "@domain/api-account-data";
import { AmountStrSchema } from "@domain/entity-account-balance";
import type { AccountOperationsPage } from "@domain/entity-account-operation";
import type { CryptoOrTokenCurrencyId, Currency } from "@domain/entity-currency";
import { findFiatCurrencyByTicker, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import {
  formatCounterValueHashes,
  lenseRateMap,
  type CounterValuesCacheView,
} from "@domain/entity-market-countervalues";

export type OperationCountervaluesHost = {
  /** The rates the app holds. */
  rates(): CounterValuesCacheView | undefined;
  /** The currency of an asset, a coin or a token; a lookup that fails leaves its rows unvalued. */
  findCurrency(
    assetId: CryptoOrTokenCurrencyId,
  ): Currency | undefined | Promise<Currency | undefined>;
};

/** The rate of the hour or day of `date`, never the latest one standing in for a missing history. */
function historicalRate(
  rates: CounterValuesCacheView,
  from: Currency,
  to: Currency,
  date: Date,
): number | undefined {
  const pair = lenseRateMap(rates, { from, to });
  if (!pair) return;
  const { hour, day } = formatCounterValueHashes(date);
  return pair.map.get(hour) || pair.map.get(day) || undefined;
}

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
    const value = new BigNumber(row.value)
      .times(rate)
      .shiftedBy(to.units[0].magnitude - from.units[0].magnitude)
      .integerValue(BigNumber.ROUND_HALF_UP);
    const countervalue = AmountStrSchema.parse(BigNumber.max(0, value).toFixed(0));
    return { ...row, countervalues: { ...row.countervalues, [ticker]: countervalue } };
  });
  return { ...page, operations };
}

/** The source, its operations valued in the fiat a query asks for when it does not value them itself. */
export function withOperationCountervalues(
  source: AccountDataSource,
  host: OperationCountervaluesHost,
): AccountDataSource {
  const read = source.read?.operations;
  const readBatch = source.readBatch?.operations;
  if (!read && !readBatch) return source;
  const findCurrency = (assetId: CryptoOrTokenCurrencyId) =>
    Promise.resolve()
      .then(() => host.findCurrency(assetId))
      .catch(() => undefined);
  const valued = async (page: AccountOperationsPage, ticker?: FiatCurrencyTicker) => {
    if (!ticker) return page;
    const assetIds = [...new Set(page.operations.map(row => row.assetId))];
    const currencies = new Map(
      await Promise.all(assetIds.map(async id => [id, await findCurrency(id)] as const)),
    );
    return valueOperations(page, ticker, host.rates(), assetId => currencies.get(assetId));
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
