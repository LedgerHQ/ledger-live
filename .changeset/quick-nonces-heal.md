---
"@ledgerhq/live-common": minor
---

Prevent "nonce too low" errors on rapid consecutive sends by deriving the next sequence from both the network source and locally-tracked pending operations.
