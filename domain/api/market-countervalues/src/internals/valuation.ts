import { BigNumber } from "bignumber.js";
import { AmountStrSchema, type BalanceAssetId } from "@domain/entity-account-balance";
import type { Currency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { findFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  formatCounterValueHashes,
  lenseRateMap,
  type CounterValuesCacheView,
} from "@domain/entity-market-countervalues";

/** Tickers the app values in as a crypto currency, whose rates are held under its id, not the fiat entry's ticker. */
const CRYPTO_COUNTERVALUES: Readonly<Record<string, string>> = { BTC: "bitcoin" };

/** The currency `ticker` values in: Bitcoin as the crypto currency, any other as its fiat. */
export function countervalueCurrencyOf(ticker: string): Currency | undefined {
  const cryptoId = Object.hasOwn(CRYPTO_COUNTERVALUES, ticker)
    ? CRYPTO_COUNTERVALUES[ticker]
    : undefined;
  return (cryptoId && findCryptoCurrencyById(cryptoId)) || findFiatCurrencyByTicker(ticker);
}

/** The rate of the hour or day of `date`, never the latest one standing in for a missing history. */
export function historicalRate(
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

/** `amount` of `from`, in its smallest unit, worth in `to`'s smallest unit at `rate`, half up. */
export function countervalueAt(amount: string, rate: number, from: Currency, to: Currency) {
  const value = new BigNumber(amount)
    .times(rate)
    .shiftedBy(to.units[0].magnitude - from.units[0].magnitude)
    .integerValue(BigNumber.ROUND_HALF_UP);
  return AmountStrSchema.parse(BigNumber.max(0, value).toFixed(0));
}

/** The currency of each asset; a lookup that fails or throws leaves its asset without one. */
export async function currenciesOf(
  findCurrency: (assetId: BalanceAssetId) => Currency | undefined | Promise<Currency | undefined>,
  assetIds: readonly BalanceAssetId[],
): Promise<(assetId: BalanceAssetId) => Currency | undefined> {
  const found = await Promise.all(
    [...new Set(assetIds)].map(async id => {
      const currency = await Promise.resolve()
        .then(() => findCurrency(id))
        .catch(() => undefined);
      return [id, currency] as const;
    }),
  );
  const byId = new Map(found);
  return assetId => byId.get(assetId);
}
