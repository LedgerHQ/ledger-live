---
"@ledgerhq/wallet-cli": minor
"@ledgerhq/live-common": minor
---

`addressFromKey` returns a branded `Address`; wallet-cli requires it wherever an address is expected, so a descriptor key can no longer be used as one
