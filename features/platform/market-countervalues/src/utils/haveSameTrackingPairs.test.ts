import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import type { TrackingPair } from "@domain/entity-market-countervalues";
import { haveSameTrackingPairs } from "./haveSameTrackingPairs";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");

function trackingPair(from: Currency, startDate = "2026-06-19T00:00:00.000Z"): TrackingPair {
  return { from, to: usd, startDate: new Date(startDate) };
}

describe("haveSameTrackingPairs", () => {
  it("matches the same pairs in another order", () => {
    expect(
      haveSameTrackingPairs(
        [trackingPair(bitcoin), trackingPair(ethereum)],
        [trackingPair(ethereum), trackingPair(bitcoin)],
      ),
    ).toBe(true);
  });

  it("tells pairs apart by currency and by start day", () => {
    const pairs = [trackingPair(bitcoin)];

    expect(haveSameTrackingPairs(pairs, [trackingPair(ethereum)])).toBe(false);
    expect(haveSameTrackingPairs(pairs, [trackingPair(bitcoin, "2026-06-20T00:00:00.000Z")])).toBe(
      false,
    );
  });

  it("hashes each list once, so the previous one is not hashed again", () => {
    const previous = [trackingPair(bitcoin), trackingPair(ethereum)];
    const next = [trackingPair(ethereum), trackingPair(bitcoin)];
    haveSameTrackingPairs([trackingPair(bitcoin)], previous);
    const toISOString = jest.spyOn(Date.prototype, "toISOString");

    haveSameTrackingPairs(previous, next);

    expect(toISOString).toHaveBeenCalledTimes(next.length);
    toISOString.mockRestore();
  });
});
