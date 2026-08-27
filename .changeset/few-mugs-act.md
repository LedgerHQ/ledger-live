---
"@ledgerhq/coin-casper": minor
---

Wire `validateAddress` in the Casper coin module API to the existing address validation logic. `getNextSequence` now returns `0n` instead of throwing, as Casper has no account nonce.
