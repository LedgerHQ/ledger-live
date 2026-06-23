import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { listCryptoCurrencies } from "./currencies";

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

// Every legacy currency incl. dev/testnet + terminated.
const legacyCurrencies = listCryptoCurrencies(true, true);
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
});
