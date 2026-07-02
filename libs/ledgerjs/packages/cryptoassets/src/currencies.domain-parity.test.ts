import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  CRYPTO_CURRENCIES_REGISTRY,
  CRYPTO_CURRENCY_ALIASES,
  findCryptoCurrencyById as findDomainCryptoCurrencyById,
  getCryptoCurrencyById as getDomainCryptoCurrencyById,
} from "@domain/entity-currency-crypto";
import {
  cryptocurrenciesById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByTicker,
  getCryptoCurrencyById,
  listCryptoCurrencies,
} from "./currencies";
import { setCryptoCurrenciesStore } from "./currencies-store";

/**
 * Parity guard between the legacy bundled registry (`@ledgerhq/cryptoassets`) and the
 * domain registry (`@domain/entity-currency-crypto`). The domain registry is seeded from
 * legacy and the two are dual-maintained during the migration, so this test fails if they
 * diverge — a missing/extra currency or any changed field — forcing both to be updated
 * together. See `domain/entity/currency-crypto/README.md`.
 *
 * Comparison is by `.id` (currency identity): `listCryptoCurrencies` is the public accessor
 * and exposes each currency once, while the domain registry is keyed by `.id`.
 */

// Every legacy currency incl. dev/testnet. Terminated currencies are always included in
// the store arrays (the `withTerminated` parameter was removed in LIVE-32899).
const legacyCurrencies = listCryptoCurrencies(true);
const legacyIds = legacyCurrencies.map(c => c.id);
const legacyById = new Map<string, CryptoCurrency>(legacyCurrencies.map(c => [c.id, c]));

const sortedLegacyIds = [...legacyIds].sort();
const domainIds = Object.keys(CRYPTO_CURRENCIES_REGISTRY).sort();

describe("@domain/entity-currency-crypto parity with @ledgerhq/cryptoassets", () => {
  // Guards the by-id Map below: a duplicate would silently overwrite and hide drift.
  it("legacy exposes no duplicate currency ids", () => {
    expect(legacyIds.length).toBe(legacyById.size);
  });

  it("covers exactly the same currency ids (incl. dev + terminated)", () => {
    expect(domainIds).toEqual(sortedLegacyIds);
  });

  it.each(sortedLegacyIds)("matches the legacy definition for %s", id => {
    expect(CRYPTO_CURRENCIES_REGISTRY[id]).toEqual(legacyById.get(id));
  });

  // The bundled map exposes a few legacy alias keys (source-literal key ≠ .id, e.g. "osmosis" → osmo).
  // CRYPTO_CURRENCY_ALIASES must mirror them so the injected store keeps resolving those keys.
  it("CRYPTO_CURRENCY_ALIASES mirrors the legacy bundled alias keys", () => {
    const legacyAliases = Object.fromEntries(
      Object.entries(cryptocurrenciesById)
        .filter(([key, currency]) => key !== currency.id)
        .map(([key, currency]) => [key, currency.id]),
    );
    expect(CRYPTO_CURRENCY_ALIASES).toEqual(legacyAliases);
  });
});

// Direct by-id accessor parity: the domain package exposes getCryptoCurrencyById/findCryptoCurrencyById
// over its static registry (LIVE-31917) — what the eventual repoint reads instead of the legacy
// accessors. Assert both resolve identically for every legacy key (canonical AND alias, e.g. "osmosis")
// and agree on misses. Runs before the injection blocks below, so legacy reads the bundled store.
const legacyKeyEntries = Object.entries(cryptocurrenciesById);
const MISSING_ID = "not_a_real_currency_id";

describe("by-id accessor parity: domain vs @ledgerhq/cryptoassets", () => {
  it.each(legacyKeyEntries)(
    "getCryptoCurrencyById(%s) matches the legacy accessor",
    (key, legacyCurrency) => {
      // Value-equal to the legacy accessor result (the two registries are dual-maintained)...
      expect(getDomainCryptoCurrencyById(key)).toEqual(getCryptoCurrencyById(key));
      // ...and resolves to the domain registry object for that id (guards alias-key resolution).
      expect(getDomainCryptoCurrencyById(key)).toBe(CRYPTO_CURRENCIES_REGISTRY[legacyCurrency.id]);
    },
  );

  it("findCryptoCurrencyById returns undefined for an unknown id (both accessors)", () => {
    expect(findDomainCryptoCurrencyById(MISSING_ID)).toBeUndefined();
    expect(findCryptoCurrencyById(MISSING_ID)).toBeUndefined();
  });

  it("getCryptoCurrencyById throws for an unknown id (both accessors)", () => {
    expect(() => getDomainCryptoCurrencyById(MISSING_ID)).toThrow();
    expect(() => getCryptoCurrencyById(MISSING_ID)).toThrow();
  });
});

// Authoritative scheme → id mapping built straight from the legacy data, not via
// findCryptoCurrencyByScheme — otherwise a regression in that accessor would be baked into the
// expected values and the injected-store assertion below could still pass.
const bundledIdByScheme = new Map(legacyCurrencies.map(c => [c.scheme, c.id]));

// id-sorted (deterministic, unlike Object.values insertion order) puts the non-canonical currency
// first for every ambiguous ticker (arbitrum < ethereum, cronos < crypto_org), so this pass fails
// if the keyword tiebreak regresses to first-in-array-wins.
const domainArraySortedById = [...Object.values(CRYPTO_CURRENCIES_REGISTRY)].sort((a, b) =>
  a.id.localeCompare(b.id),
);
// Reversed to exercise the opposite ordering and confirm full order-independence.
const domainArrayReversed = [...domainArraySortedById].reverse();

const AMBIGUOUS_TICKERS = [
  { ticker: "ETH", expectedId: "ethereum" },
  { ticker: "BNB", expectedId: "bsc" },
  { ticker: "DOT", expectedId: "polkadot" },
  { ticker: "XTZ", expectedId: "tezos" },
  { ticker: "CRO", expectedId: "crypto_org" },
] as const;

function clearInjectedStore() {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  (globalThis as Record<string, unknown>).__ledgerCryptoCurrenciesStore = undefined;
}

describe("lookup parity: bundled store vs injected domain array", () => {
  describe("bundled store", () => {
    it.each(AMBIGUOUS_TICKERS)(
      'findCryptoCurrencyByTicker("$ticker") → $expectedId',
      ({ ticker, expectedId }) => {
        expect(findCryptoCurrencyByTicker(ticker)?.id).toBe(expectedId);
      },
    );
  });

  describe.each([
    ["id-sorted order (non-canonical currency first)", domainArraySortedById],
    ["reversed order (order-independence check)", domainArrayReversed],
  ] as const)("injected domain store — %s", (_, currencies) => {
    beforeEach(() => setCryptoCurrenciesStore([...currencies]));
    afterEach(clearInjectedStore);

    it.each(AMBIGUOUS_TICKERS)(
      'findCryptoCurrencyByTicker("$ticker") → $expectedId',
      ({ ticker, expectedId }) => {
        expect(findCryptoCurrencyByTicker(ticker)?.id).toBe(expectedId);
      },
    );

    it("findCryptoCurrencyByScheme is identical to bundled for all currencies", () => {
      for (const [scheme, bundledId] of bundledIdByScheme) {
        expect(findCryptoCurrencyByScheme(scheme)?.id).toBe(bundledId);
      }
    });
  });
});

// Guards the injection contract used by every app's bootstrap (`setCryptoCurrenciesStore(
// Object.values(CRYPTO_CURRENCIES_REGISTRY), CRYPTO_CURRENCY_ALIASES)`): once injected, the store
// has no per-key fallback, so `getCryptoCurrencyById` must resolve every id — and every alias — or
// it throws. This is the guard against the alias-key regression class (e.g. legacy "osmosis" → osmo).
describe("getCryptoCurrencyById over the injected domain registry", () => {
  beforeEach(() =>
    setCryptoCurrenciesStore(Object.values(CRYPTO_CURRENCIES_REGISTRY), CRYPTO_CURRENCY_ALIASES),
  );
  afterEach(clearInjectedStore);

  it.each(sortedLegacyIds)("resolves %s to the domain object", id => {
    expect(getCryptoCurrencyById(id)).toBe(CRYPTO_CURRENCIES_REGISTRY[id]);
  });

  it.each(Object.entries(CRYPTO_CURRENCY_ALIASES))(
    "resolves legacy alias %s to its canonical currency",
    (alias, id) => {
      expect(getCryptoCurrencyById(alias)).toBe(CRYPTO_CURRENCIES_REGISTRY[id]);
    },
  );
});
