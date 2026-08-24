---
"@ledgerhq/coin-kaspa": minor
"@ledgerhq/live-common": minor
---

Fix UTXO selection picking an immature coinbase output ahead of a mature one across a digit-count boundary (sortUtxos compared blockDaaScore lexicographically as a string instead of numerically, e.g. treating "1202" as less than "200"), fix combine() to correctly unpack and validate the JSON-encoded per-input signature array the generic-adapter signer returns, and set a synthetic zero nonce in the generic-coin-framework's default Kaspa transaction (matching the existing near/vechain/cardano pattern) so getNextSequence is never called for a UTXO chain that has no account-level sequence.
