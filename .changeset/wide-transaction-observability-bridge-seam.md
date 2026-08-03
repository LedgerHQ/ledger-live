---
"@ledgerhq/transaction-observability": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add the new `@ledgerhq/transaction-observability` package — the sign/broadcast log-event model, the global observer registry, error/product-flow classification, and the Segment mapping now live in a dedicated `libs/*` package rather than in the deprecated `@ledgerhq/live-common` (which no longer accepts new top-level modules). `@ledgerhq/live-common`, ledger-live-desktop, and ledger-live-mobile consume it.

Add wide transaction (sign + broadcast) observability at the account-bridge seam. `wrapAccountBridge` now decorates `signOperation` and `broadcast` and emits a normalized `LogEvent` (stage, status, `ErrorCategory`, currency, flow) through a global observer registry (`setTransactionObserver`/`emitTransactionEvent`), covering every route (native send/staking, wallet-api, dApp) and coin without touching the pure coin modules. Adds funnel `started` and sign-prompt `abandoned` events from the device-action layer, classifies device/transport status errors (incl. on-device declines), derives a `productFlow` (stake/unstake/restake/claim/send) distinct from the technical `flow`, and captures the delegation target `validators` (pool/validator id) at the sign stage. Desktop registers a dev-only console observer to verify events locally. Adds an additive Segment/Mixpanel observer (desktop + mobile) forwarding the seam's events as `Transaction Sign Started` / `Transaction Sign Failed` / `Transaction Broadcast Success` / `Transaction Broadcast Failed` (self-gating on analytics consent, no raw signatures) — the existing Datadog `useBroadcast` path is left untouched.
