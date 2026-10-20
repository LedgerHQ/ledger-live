---
"@features/platform-coin-observability": minor
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Move the coin-module call event, its observer registry and the transmission policy out of live-common into `@features/platform-coin-observability`; live-common keeps only the `withMetrics` resolver adapter.
