---
"@ledgerhq/coin-aleo": minor
---

Implement the `combine` method and wire `broadcast` in the coin-aleo framework API: `combine` validates the ordered signature list (root first, then nested calls), reads the view key off the `Context`, and returns the hex-encoded SDK authorization.
