---
"@ledgerhq/coin-aleo": minor
---

Add the `register` method to the coin-aleo framework API: it seals the account view key to the Provable record scanner and returns the `{ type: "aleo", provableId }` handle, sharing the seal-and-enroll sequence with the bridge's `accessProvableApi`.
