---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add a shared broadcast log-event helper (flow/error-type categorisation, cross-family transaction type) and pass an optional `broadcastLogger` through the wallet-api entry points. Refactor `useBroadcast` to consume the helper, wire the `transaction.signAndBroadcast` flow, and inject the logger from the desktop and mobile webviews.
