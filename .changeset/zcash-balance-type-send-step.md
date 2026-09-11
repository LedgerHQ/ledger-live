---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

add balance-type pool selection step to Zcash send flow

The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.

The recipient step's transfer-to-my-other-pool shortcut now records the transfer on the transaction (for Zcash, `selfTransfer`), so the prefilled address keeps its self-transfer semantics instead of looking like a send to a typed address. Picking any other recipient clears it again.
