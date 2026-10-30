import { AmountStrSchema } from "@domain/entity-account-balance";
import type { AccountOperation, CountervalueTicker } from "@domain/entity-account-operation";
import { findFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { seededRandom } from "../random";

const DAY = 86_400_000;
const CYCLE_DAYS = 90;

/** A seeded price of one whole coin of the asset in the fiat's smallest unit, swinging ±30% over a 90-day cycle. */
function priceAt(assetId: string, ticker: CountervalueTicker, fiatMagnitude: number, date: string) {
  const random = seededRandom(`${assetId}:${ticker}:price`);
  const base = Math.exp(Math.log(0.5) + random() * (Math.log(50_000) - Math.log(0.5)));
  const phase = random() * 2 * Math.PI;
  const days = Date.parse(date) / DAY;
  const swing = 1 + 0.3 * Math.sin(phase + (2 * Math.PI * days) / CYCLE_DAYS);
  return BigInt(Math.round(base * swing * 10 ** fiatMagnitude));
}

/** Each row valued in `ticker` at its date, as FullSync does; a row of an asset without a known magnitude, or an unknown fiat, has none. */
export function withMockCountervalues(
  rows: AccountOperation[],
  ticker: CountervalueTicker,
  magnitudeOf: (assetId: string) => number | undefined,
): AccountOperation[] {
  const fiat = findFiatCurrencyByTicker(ticker);
  if (!fiat) return rows;
  const fiatMagnitude = fiat.units[0].magnitude;
  return rows.map(row => {
    const magnitude = magnitudeOf(row.assetId);
    if (magnitude === undefined) return row;
    const price = priceAt(row.assetId, ticker, fiatMagnitude, row.date);
    const countervalue = (BigInt(row.value) * price) / 10n ** BigInt(magnitude);
    return { ...row, countervalues: { [ticker]: AmountStrSchema.parse(countervalue.toString()) } };
  });
}
