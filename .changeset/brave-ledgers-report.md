---
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/live-common": minor
---

Report each chain's account data through its coin module, so the portfolio layer can serve it: coin-tron's `getAccountInfo` adds `activated` and the JSON form of `tronResources` (its `toTronResourcesRaw`/`fromTronResourcesRaw` converters move from live-common, which re-exports them), coin-solana's and coin-cosmos's new `getAccountInfo` report the token account shapes and the redelegations, and coin-hedera's API lists the accounts of a public key with `getAddressesForPublicKey`
