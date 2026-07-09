---
"@ledgerhq/live-common": minor
---

Repoint all `@ledgerhq/cryptoassets` value imports across live-common to `@domain/entity-currency-*` / `@domain/api-currency-token`. Remaining direct usages are intentional shims (`currencies/tokenStore.ts`, `test-helpers/cryptoAssetsStore.ts`) or pure type imports.
