---
"@ledgerhq/transaction-observability": minor
---

Report the originating live-app or dApp as `manifest_id` rather than `provider` on `earn_transaction_completed` / `earn_transaction_failed`.

The value was always a manifest id, and `provider` means something else in Ledger Wallet's analytics: the staking or swap partner behind a flow. `manifest_id` is also the name the rest of the codebase already uses for this identifier, including the feature-flag params that supply it.

No consumer is affected. The host apps only register the observer in the bridge-seam change, so no event has carried either property in production yet.
