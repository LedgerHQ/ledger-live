---
"@ledgerhq/wallet-cli": patch
---

`agent-intent sync` pulls every Ledger Sync account again only when this wallet-cli can import accounts an earlier one skipped, not after every upgrade
