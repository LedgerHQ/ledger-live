---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

chore(coin-solana): remove preload and hydrate - fetch validators on demand

`CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

`useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
`useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.
