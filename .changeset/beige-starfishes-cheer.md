---
"@ledgerhq/cryptoassets": minor
---

refactor(cryptoassets): use globalThis as sole store reference to fix lazy-loaded coin-modules

Replace the module-scoped `let` variable with `globalThis.__ledgerCryptoAssetsStore`
as the single source of truth for CryptoAssetsStore. When coin-modules are
lazy-loaded, bundlers may resolve separate module copies, causing the module-level
variable to be undefined even after the store was set. Using globalThis exclusively
avoids this duplicate-reference issue.

Also removes unused `getReduxStore`/`setReduxStore` (no external consumers).
