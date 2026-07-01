import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { FIAT_CURRENCIES_REGISTRY } from "@domain/entity-currency-fiat";
import { listFiatCurrencies } from "./fiats";

/**
 * Parity guard between the legacy bundled fiat registry (`@ledgerhq/cryptoassets`) and the
 * domain registry (`@domain/entity-currency-fiat`). The domain registry is seeded from legacy
 * and the two are dual-maintained during the migration, so this test fails if they diverge —
 * a missing/extra currency or any changed field — forcing both to be updated together. See
 * `domain/entity/currency-fiat/README.md`.
 *
 * Legacy fiats carry no `id`; the domain entity does, derived as the lowercased ticker. The
 * expected domain object is therefore the legacy object plus that `id`.
 */

const legacyCurrencies = listFiatCurrencies();
const legacyTickers = legacyCurrencies.map(c => c.ticker);
const legacyByTicker = new Map<string, FiatCurrency>(legacyCurrencies.map(c => [c.ticker, c]));

const sortedTickers = [...legacyTickers].sort();
const expectedIds = legacyTickers.map(t => t.toLowerCase()).sort();
const domainIds = Object.keys(FIAT_CURRENCIES_REGISTRY).sort();

describe("@domain/entity-currency-fiat parity with @ledgerhq/cryptoassets", () => {
  // Guards the by-ticker Map below: a duplicate would silently overwrite and hide drift.
  it("legacy exposes no duplicate tickers", () => {
    expect(legacyTickers.length).toBe(legacyByTicker.size);
  });

  it("covers exactly the same currencies (id = lowercased ticker)", () => {
    expect(domainIds).toEqual(expectedIds);
  });

  it.each(sortedTickers)("matches the legacy definition for %s", ticker => {
    const id = ticker.toLowerCase();
    expect(FIAT_CURRENCIES_REGISTRY[id]).toEqual({ ...legacyByTicker.get(ticker), id });
  });
});
