---
"@ledgerhq/live-common": minor
---

Show the real on-chain received amount for finished DEX swaps in swap history. `getCompleteSwapHistory` now derives `finalAmount` from the receiving account's incoming operation (including native receives via internal operations) instead of always falling back to the quoted `toAmount`, so both the history rows and the transaction status detail/drawer reflect what was actually received.
