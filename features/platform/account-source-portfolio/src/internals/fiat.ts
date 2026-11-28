import BigNumber from "bignumber.js";
import { findFiatCurrencyByTicker, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";

/** The countervalue currency, how the service names it, and how many decimals its smallest unit has. */
export type Fiat = { ticker: FiatCurrencyTicker; currency: string; magnitude: number };

/** The countervalues that are not ISO 4217 codes, by the CAL id the service takes for them. */
const CRYPTO_COUNTERVALUES: Readonly<Record<string, string>> = { BTC: "bitcoin", XBT: "bitcoin" };

/**
 * Undefined when the query asks for no countervalue, or for an unknown one. The service takes an
 * ISO 4217 code or a CAL currency id: BTC or XBT goes as `bitcoin`, a fiat such as MNT stays as is.
 */
export function fiatOf(query: { countervalue?: FiatCurrencyTicker } | undefined): Fiat | undefined {
  const ticker = query?.countervalue;
  const unit = ticker && findFiatCurrencyByTicker(ticker)?.units[0];
  if (!ticker || !unit) return undefined;
  const currency = Object.hasOwn(CRYPTO_COUNTERVALUES, ticker)
    ? CRYPTO_COUNTERVALUES[ticker]
    : ticker;
  return { ticker, currency, magnitude: unit.magnitude };
}

/** A service `currency_value`, in the fiat's main unit, as countervalues in its smallest unit, half up. */
export function countervaluesOf(worth: BigNumber.Value | null | undefined, fiat: Fiat | undefined) {
  if (!fiat || worth === null || worth === undefined) return undefined;
  const value = new BigNumber(worth)
    .abs()
    .shiftedBy(fiat.magnitude)
    .integerValue(BigNumber.ROUND_HALF_UP);
  return { countervalues: { [fiat.ticker]: value.toFixed(0) } };
}
