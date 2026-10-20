---
"@ledgerhq/coin-aptos": minor
---

fix(coin-aptos): stop resolving the currency with `getCryptoCurrencyById` in `isTestnet`

`isTestnet` now reads the network from the currency id (`aptos_testnet`) instead of looking up the
currency's `isTestnetFor` through the host currencies resolver. Only the classic bridge and
`getValidators` (via preload) build `AptosAPI` from a currency id; the API path already builds it from
`config.aptosSettings`.
