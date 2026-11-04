---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
"@devtools/bindings": minor
"@ledgerhq/live-common": minor
"@shared/env": minor
---

Run Ledger Sync from the store middleware of `@features/platform-wallet-sync`, and take its Trustchain and Cloud Sync URLs from the `ledgerKeyRing` app config switch instead of the `environment` param of the `lldWalletSync` and `llmWalletSync` feature flags. The web-tools trustchain page lists its own backends, and the devtools prod toggle takes the host's backends. `getEnvironmentParams` and the `CLOUD_SYNC_API_*` and `TRUSTCHAIN_API_*` env definitions are deprecated.
