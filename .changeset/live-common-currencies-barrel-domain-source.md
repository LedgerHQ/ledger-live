---
"@ledgerhq/live-common": minor
---

Repoint the `currencies` barrel re-exports off `@ledgerhq/cryptoassets` onto domain entity packages: crypto currency accessors now come from `@domain/entity-currency-crypto` and fiat currency accessors from `@domain/entity-currency-fiat`. Runtime behaviour is unchanged — the domain registry is already the single source of truth via the injected crypto store and the fiat domain seed.
