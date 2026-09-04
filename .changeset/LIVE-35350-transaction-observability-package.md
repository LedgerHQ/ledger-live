---
"@ledgerhq/transaction-observability": minor
---

Add `@ledgerhq/transaction-observability`: the sign/broadcast log-event model, a global observer registry, error classification, staking-action derivation and the Segment mapping behind `earn_transaction_completed` / `earn_transaction_failed`. Nothing consumes it yet — the account-bridge seam and the host registrations follow.

It lives in a dedicated `libs/*` package rather than `@ledgerhq/live-common` (which no longer accepts new top-level modules), and deliberately does not depend on live-common, since live-common depends on it.

The two lifecycle stages see different things, and that drives the design: `signOperation` gets the rich transaction (the family's own `mode`, the delegation target), while `broadcast` gets only the optimistic operation and so has to read a coarser `OperationType`. There are therefore two derivations — `deriveEarnTransactionType` and `deriveFromOperationType` — and a per-family matrix test asserts they agree. Without the second one a successful Solana stake derives no action at all and is dropped, because its sign-stage `stake.createAccount` becomes a `DELEGATE` operation at broadcast.

Emission is gated on having derived a staking action, so plain sends and swaps are ignored without needing a currency allowlist, and generic operation types (`OUT`, `IN`, `NONE`, `FEES`) are never mapped. Transactions originating from the Earn live-app are skipped because that app emits these events itself. Events carry `stage`, `transaction_type`, `raw_transaction_type`, `input_currency`, `network`, `validators`, `error_category` + `error_reason` on failure, and `tx_data_source` so the sign-vs-broadcast provenance is measurable — never a raw error message or signature.
