---
"@ledgerhq/coin-cosmos": major
"@ledgerhq/live-common": minor
---

fix(coin-cosmos): stop resolving the currency with `getCryptoCurrencyById`

The module no longer needs the host currencies resolver. The on-chain base denom (e.g. `uatom`),
formerly read from the currency's `units[1].code`, comes from a new required `denom` field of the
Cosmos coin config, served in every `config_currency_<id>`. `createApi(currencyId)` uses its
`currencyId` directly where the id is needed. The bridge passes `account.currency.units[1].code`,
`preload` reuses the currency it receives, and `getTransactionStatus` drops its registry lookup by
name while keeping the same prefix check. `CosmosCoinConfig` is now typed as
`CurrencyConfig & { denom: string }` instead of reusing the live-config map type.

Breaking: `CosmosAPI.getCurrency()` is removed. `CosmosAPI.getAccountInfo`, `getAllBalances`,
`getDelegations`, `getStakingPositions` and `getRedelegationsWithQueued` take a denom string instead
of a `CryptoCurrency`. `getBalance`, `getStakes`, `listOperations` and `craftTransaction` take the
coin config as first parameter; `estimateFees` takes `(config, currencyId, intent)`; and
`getRedelegations` takes `(currencyId, denom, address)`.
