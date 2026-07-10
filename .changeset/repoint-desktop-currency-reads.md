---
"ledger-live-desktop": minor
---

Repoint desktop UI currency reads from `@ledgerhq/cryptoassets` and the `@ledgerhq/live-common/currencies` barrel to `@domain/entity-currency-{crypto,fiat}` and `@features/platform-currencies` hooks directly.
