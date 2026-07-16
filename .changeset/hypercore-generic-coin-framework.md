---
"@ledgerhq/live-common": minor
"@ledgerhq/cryptoassets": minor
"@ledgerhq/types-live": minor
"@domain/entity-currency-crypto": minor
---

Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module.
