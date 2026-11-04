---
"@ledgerhq/wallet-cli": patch
---

The embedded wallet-cli skill no longer says every `send --data` call is decoded on the device: when the device does not decode the call, the human rejects it and the agent stops instead of suggesting blind signing
