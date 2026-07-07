---
"@ledgerhq/coin-tezos": minor
"@ledgerhq/live-common": minor
---

feat(coin-tezos): support multi-asset FA2 contracts (wrapped tokens)

Remove the tokenId=0 filter in TzKT queries so balances and operations
for all FA2 tokens are returned, including multi-asset contracts like
the Wrapped Tokens Contract (KT18fp5rc…).

Parse the assetReference (contract:tokenId) in the Tezos bridge to pass
tokenIdentifier to findTokenByAddressInCurrency, enabling correct CAL
token resolution for multi-asset contracts.
