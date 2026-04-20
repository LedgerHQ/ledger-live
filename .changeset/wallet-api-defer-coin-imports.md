---
"@ledgerhq/live-common": minor
---

Remove direct runtime imports of `@ledgerhq/coin-bitcoin/wallet-btc` and `@ledgerhq/coin-evm/utils` from wallet-api logic; deferred via new `loadGetWalletAccountForFamily` and `loadEvmUtilsForFamily` registry loaders. The no-coin-eager-imports test now enforces this for wallet-api code.
