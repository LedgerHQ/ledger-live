---
"@ledgerhq/live-common": minor
"@ledgerhq/transaction-observability": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.
