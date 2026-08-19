---
"@ledgerhq/coin-sui": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Reject a SUI unstake above the staking position's principal, and make the remainder error actionable

A partial unstake calls `staking_pool::split`, which asserts the withdrawn amount is at most the
principal. Nothing validated that locally, so an amount far above the staked balance passed
validation and only aborted on chain. It now fails with a dedicated error. The remainder error also
names the way out — withdraw in full — because a position under 2 SUI cannot be split at all.
