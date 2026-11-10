---
"@ledgerhq/coin-solana": major
"@ledgerhq/live-common": patch
"@ledgerhq/wallet-cli": patch
"@ledgerhq/coin-tester-solana": patch
---

refactor(coin-solana): replace `rpcUrls` by a single `rpcUrl` per currency config. Breaking: `endpointByCurrencyId` is removed, `chainConfigFrom` and `createApi` no longer take a currency id.
