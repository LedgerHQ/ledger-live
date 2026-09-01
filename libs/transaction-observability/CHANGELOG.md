# @ledgerhq/transaction-observability

## 0.2.0-next.0

### Minor Changes

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report the originating live-app or dApp as `manifest_id` rather than `provider` on `earn_transaction_completed` / `earn_transaction_failed`.

  The value was always a manifest id, and `provider` means something else in Ledger Wallet's analytics: the staking or swap partner behind a flow. `manifest_id` is also the name the rest of the codebase already uses for this identifier, including the feature-flag params that supply it.

  No consumer is affected. The host apps only register the observer in the bridge-seam change, so no event has carried either property in production yet.

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Correlate the sign and broadcast stages, so a broadcast event carries the transaction's own data rather than what survives on the optimistic operation.

  `signOperation` emits a `SignedOperation` and that same object is later handed to `broadcast`, so object identity is the correlation key — nothing to invent, nothing to reconcile. A `WeakMap` means no TTL, no eviction policy and no size cap to get wrong, and no signature is retained: a transaction signed but never broadcast simply becomes garbage.

  Without this, the broadcast stage is uneven in ways a data consumer cannot predict. Cosmos copies its validators into the optimistic operation and Solana does not; Hedera's `claim-rewards` and Algorand's `claimReward` are crafted as plain transfers and so report `OUT`, and Solana's `stake.withdraw` reports `IN` — indistinguishable from an incoming transfer. Correlation recovers the exact action, the delegation target and send-max for all of them.

  Correlation legitimately misses when a signed operation is serialised and rehydrated (the wallet-api `transaction.sign` route, or one persisted and broadcast later) and for ACRE, which signs outside the wrapper. Those fall back to the operation type. `tx_data_source` on every event records which path produced it, so the hit rate is measurable rather than assumed. Route attribution still comes from the broadcast stage, which is the only stage that knows it.

- [#20817](https://github.com/LedgerHQ/ledger-live/pull/20817) [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add `@ledgerhq/transaction-observability`: the sign/broadcast log-event model, a global observer registry, error classification, staking-action derivation and the Segment mapping behind `earn_transaction_completed` / `earn_transaction_failed`. Nothing consumes it yet — the account-bridge seam and the host registrations follow.

  It lives in a dedicated `libs/*` package rather than `@ledgerhq/live-common` (which no longer accepts new top-level modules), and deliberately does not depend on live-common, since live-common depends on it.

  The two lifecycle stages see different things, and that drives the design: `signOperation` gets the rich transaction (the family's own `mode`, the delegation target), while `broadcast` gets only the optimistic operation and so has to read a coarser `OperationType`. There are therefore two derivations — `deriveEarnTransactionType` and `deriveFromOperationType` — and a per-family matrix test asserts they agree. Without the second one a successful Solana stake derives no action at all and is dropped, because its sign-stage `stake.createAccount` becomes a `DELEGATE` operation at broadcast.

  Emission is gated on having derived a staking action, so plain sends and swaps are ignored without needing a currency allowlist, and generic operation types (`OUT`, `IN`, `NONE`, `FEES`) are never mapped. Transactions originating from the Earn live-app are skipped because that app emits these events itself. Events carry `stage`, `transaction_type`, `raw_transaction_type`, `input_currency`, `network`, `validators`, `error_category` + `error_reason` on failure, and `tx_data_source` so the sign-vs-broadcast provenance is measurable — never a raw error message or signature.

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @shared/env@0.5.0-next.0
  - @ledgerhq/types-live@6.122.0-next.0
