---
"@ledgerhq/wallet-cli": patch
---

The embedded wallet-cli skill no longer says every `send --data` call is decoded on the device: a contract without a clear-signing descriptor cannot be clear-signed, and the agent stops instead of suggesting blind signing
