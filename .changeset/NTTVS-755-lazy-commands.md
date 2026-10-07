---
"@ledgerhq/wallet-cli": patch
---

Load only the invoked command's modules at startup, build the binaries without Bunli command generation, and report `ring encrypt` and `ring decrypt` under their own names in analytics
