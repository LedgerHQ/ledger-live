---
"@domain/entity-currency-crypto": minor
"@ledgerhq/cryptoassets": minor
---

Seed `@domain/entity-currency-crypto` to parity with the legacy `@ledgerhq/cryptoassets` registry and add a CI parity test (in cryptoassets) that fails if the two diverge. The domain registry is now the primary source of truth; both are dual-maintained until legacy is dropped. The generator now dedupes by currency `.id` and removes stale files, so legacy alias/casing keys no longer produce duplicate entries.
