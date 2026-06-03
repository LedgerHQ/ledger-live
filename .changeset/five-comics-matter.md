---
"ledger-live-desktop": patch
"@ledgerhq/coin-tezos": patch
---

Fix the Tezos "Earn" flow for accounts that are already delegated. Pressing Earn (from the account header or the delegation panel) on a delegated account now opens the staking flow instead of a delegation, which the node rejects as `delegate.unchanged`. When the staking feature is disabled and a re-delegation to the current baker is attempted, the error is now shown as "Your account is already delegated to this validator" instead of a missing translation key.
