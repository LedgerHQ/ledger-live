---
"@ledgerhq/coin-cardano": major
"@ledgerhq/live-common": minor
"@ledgerhq/coin-tester-cardano": patch
---

fix(coin-cardano): stop resolving the currency with `getCryptoCurrencyById`

The module no longer needs the host currencies resolver. The network is read from a new required
`testnet` field of the Cardano coin config, served `false` in `config_currency_cardano` and `true` in
a new `config_currency_cardano_testnet`. `createApi(currencyId)` resolves the config with
`context.config()` and uses its `currencyId` directly where the id itself is needed (operation ids,
TTL, network parameters, pool bech32 ids), so no `id` is added to the config. The bridge resolves the
config for the account's currency instead of always reading `cardano`.

Breaking: `CardanoConfig` requires `testnet`. `isTestnet`, `lastBlock`, `getValidators`, `getBalance`,
`getStakes`, `broadcast`, `validateIntent`, `fetchDelegation`, `getTransactions` and the api fetchers
(`fetchNetworkInfo`, `fetchLatestBlock`, `fetchEpochInfo`, `fetchPoolList`, `fetchPoolDetails`,
`getDelegationInfo`, `getAllTransactionsByKeys`, `submitTransaction`) take the coin config instead of
a currency, as first parameter. `listOperations`, `craftTransaction`, `buildUnsignedTransaction` and
`estimateFees` take `(config, currencyId, ...)`. The live-common `fetchPoolDetails` and
`useCardanoFamilyPools` keep taking a currency and resolve its config.
