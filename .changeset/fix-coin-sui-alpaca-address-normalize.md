---
"@ledgerhq/coin-sui": patch
---

fix(coin-sui): normalize address in `alpacaGetOperationAmount` so that AlpacaApi.listOperations resolves operation amounts when the account address omits `0x` or differs in hex casing from RPC `AddressOwner` values
