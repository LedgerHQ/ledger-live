---
"@ledgerhq/live-common": minor
"@shared/env": minor
"@ledgerhq/wallet-cli": minor
---

Delete `getEnvironmentParams` and the `CLOUD_SYNC_API_*` and `TRUSTCHAIN_API_*` env definitions, which nothing reads since Ledger Sync follows the `ledgerKeyRing` app config switch. wallet-cli reaches LKRP through its own `TRUSTCHAIN_URLS` and no longer reads the `TRUSTCHAIN_API_PROD` env variable.
