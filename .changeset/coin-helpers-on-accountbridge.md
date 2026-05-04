---
"@ledgerhq/types-live": minor
"@ledgerhq/live-common": minor
---

Move coin-specific helpers onto AccountBridge as optional synchronous methods.

AccountBridge now exposes isAccountEmpty, clearAccount, getStakesCount,
isEditableOperation, isStuckOperation and getStuckAccountAndOperation directly,
eliminating the async CoinModuleLoader indirection for these helpers.
