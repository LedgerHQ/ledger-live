---
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@domain/entity-currency-crypto": minor
---

chore(currency): drop `CryptoCurrency#ethereumLikeInfo`

The EVM `chainId` is now read from the coin config. The unused `ethereumLikeInfo` field (and `EthereumLikeInfoSchema`) is removed from the currency types and registry.
