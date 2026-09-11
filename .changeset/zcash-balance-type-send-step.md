---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

add balance-type pool selection step to Zcash send flow

The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.
