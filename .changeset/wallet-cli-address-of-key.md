---
"@ledgerhq/wallet-cli": patch
"@ledgerhq/live-common": patch
---

`addressFromKey` returns a branded `Address`; wallet-cli requires it wherever an address is expected, so a descriptor key can no longer be used as one
