---
"@ledgerhq/coin-polkadot": major
---

fix(coin-polkadot): stop resolving the currency with `getCryptoCurrencyById` on broadcast, crafting and fee estimation

`broadcast`, `craftTransaction` and `estimateFees` no longer look the currency up: the API's
`currencyId` is passed straight through to the sidecar, which only ever read the currency id (to pick
the `assethub_polkadot` / `westend` sidecar routes and as a cache key). Crafting, fee estimation and
broadcasting now hit the same sidecar route for a given currency.

Breaking: `createApi(currencyId)` now requires the currency id, and `broadcast` takes it as a required
third parameter. The `network/sidecar` functions, `network/node` `fetchStakingInfo`, every method of the
`polkadotAPI` facade (`network`) and its `hydrateValidators` / `hydrateStakingProgress` /
`hydrateMinimumBondBalance` helpers take a currency id instead of a `CryptoCurrency`, as do
`craftTransaction`, `craftEstimationTransaction` and `estimateFees`.
