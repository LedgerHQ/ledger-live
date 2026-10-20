---
"@ledgerhq/coin-hedera": major
"@ledgerhq/live-common": minor
---

fix(coin-hedera): stop resolving the currency with `getCryptoCurrencyById` / `findCryptoCurrencyById`

The module no longer needs the host currencies resolver. Fee estimation and token-association
validation use the input `currencyId` instead of looking the currency up: the countervalues request
sends it as `froms`, and the rate cache is keyed by it instead of the ticker. The `InvalidAddress`
message of `safeParseAccountId` takes the name of the resolved config. The API's `validateAddress` parses with the context config instead of a currency id.

Breaking: `getCurrencyToUSDRate` takes a currency id instead of a `Currency`, and `getTokenFromAsset`
takes `(currencyId, asset)` instead of `(currency, asset)`.
