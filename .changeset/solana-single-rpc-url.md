---
"@ledgerhq/coin-solana": major
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-cli": minor
"@ledgerhq/coin-tester-solana": minor
---

refactor(coin-solana): replace `rpcUrls` by a single `rpcUrl` per currency config. Breaking: `endpointByCurrencyId` is removed, `chainConfigFrom` and `createApi` no longer take a currency id.
