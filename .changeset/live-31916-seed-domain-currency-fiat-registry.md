---
"@domain/entity-currency-fiat": minor
"@ledgerhq/cryptoassets": minor
---

Seed `@domain/entity-currency-fiat` to parity with the legacy `@ledgerhq/cryptoassets` fiat registry and add a CI parity test (in cryptoassets) that fails if the two diverge. The domain registry is now the primary source of truth; both are dual-maintained until legacy is dropped. Legacy fiats carry no `id`; the domain `id` is the lower-cased ticker (e.g. `USD` → `usd`), which the parity test compares on.
