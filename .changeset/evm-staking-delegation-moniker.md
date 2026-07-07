---
"ledger-live-desktop": patch
---

Fix EVM native staking delegation row not always showing the validator name on the account page. The moniker is now resolved from the reactive validators hook (the same source as the Delegate modal) instead of `account.stakingResources.validators`, which was only populated by a successful, non-empty account sync and could leave the raw validator address showing until the next sync.
