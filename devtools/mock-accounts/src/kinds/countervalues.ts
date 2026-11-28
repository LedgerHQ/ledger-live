import { AmountStrSchema } from "@domain/entity-account-balance";
import type { OperationCountervalues } from "@domain/entity-account-operation";
import { findFiatCurrencyByTicker, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import type { MockContext } from "../families/types";
import { seededRandom } from "../random";

const DAY = 86_400_000;
const CYCLE_DAYS = 90;

/** A seeded price of one whole coin of the asset in the fiat's smallest unit, swinging ±30% over a 90-day cycle. */
function priceAt(assetId: string, ticker: FiatCurrencyTicker, fiatMagnitude: number, date: string) {
  const random = seededRandom(`${assetId}:${ticker}:price`);
  const base = Math.exp(Math.log(0.5) + random() * (Math.log(50_000) - Math.log(0.5)));
  const phase = random() * 2 * Math.PI;
  const days = Date.parse(date) / DAY;
  const swing = 1 + 0.3 * Math.sin(phase + (2 * Math.PI * days) / CYCLE_DAYS);
  return BigInt(Math.round(base * swing * 10 ** fiatMagnitude));
}

/** The magnitude of the account's native coin, or of a token its family knows. */
export const accountMagnitudeOf =
  ({ currency, family }: Pick<MockContext, "currency" | "family">) =>
  (assetId: string) =>
    assetId === currency.id ? currency.units[0].magnitude : family.tokenMagnitude?.(assetId);

/** Values an amount in `ticker` at its date, as FullSync does; none for an unknown fiat, or an asset without a known magnitude. */
export function mockCountervalueOf(
  ticker: FiatCurrencyTicker,
  magnitudeOf: (assetId: string) => number | undefined,
): (assetId: string, value: bigint, date: string) => OperationCountervalues | undefined {
  const fiat = findFiatCurrencyByTicker(ticker);
  const fiatMagnitude = fiat?.units[0].magnitude;
  return (assetId, value, date) => {
    const magnitude = magnitudeOf(assetId);
    if (fiatMagnitude === undefined || magnitude === undefined) return undefined;
    const price = priceAt(assetId, ticker, fiatMagnitude, date);
    return {
      [ticker]: AmountStrSchema.parse(((value * price) / 10n ** BigInt(magnitude)).toString()),
    };
  };
}
