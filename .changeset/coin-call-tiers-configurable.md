---
"@features/platform-coin-observability": minor
"@shared/feature-flags": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Make the `coin_module_call` tiers remotely configurable: a new `methodTiers` param of the `coinObservability` flag moves a coin-module method to the `transaction`, `preparation`, `sync` or `off` tier without a release. `craftTransactionData` moves to the `preparation` tier, since the bridge calls it on every edit of a transaction, and each `coin_module_call` now carries its `tier`.
