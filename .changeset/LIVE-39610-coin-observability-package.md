---
"@features/platform-coin-observability": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Move the coin-module call event, its observer registry and the transmission policy out of live-common into `@features/platform-coin-observability`; live-common keeps only the `withMetrics` resolver adapter.
