---
"@ledgerhq/transaction-observability": minor
"@ledgerhq/live-common": minor
---

Correlate the sign and broadcast stages, so a broadcast event carries the transaction's own data rather than what survives on the optimistic operation.

`signOperation` emits a `SignedOperation` and that same object is later handed to `broadcast`, so object identity is the correlation key — nothing to invent, nothing to reconcile. A `WeakMap` means no TTL, no eviction policy and no size cap to get wrong, and no signature is retained: a transaction signed but never broadcast simply becomes garbage.

Without this, the broadcast stage is uneven in ways a data consumer cannot predict. Cosmos copies its validators into the optimistic operation and Solana does not; Hedera's `claim-rewards` and Algorand's `claimReward` are crafted as plain transfers and so report `OUT`, and Solana's `stake.withdraw` reports `IN` — indistinguishable from an incoming transfer. Correlation recovers the exact action, the delegation target and send-max for all of them.

Correlation legitimately misses when a signed operation is serialised and rehydrated (the wallet-api `transaction.sign` route, or one persisted and broadcast later) and for ACRE, which signs outside the wrapper. Those fall back to the operation type. `tx_data_source` on every event records which path produced it, so the hit rate is measurable rather than assumed. Route attribution still comes from the broadcast stage, which is the only stage that knows it.
