---
"@ledgerhq/wallet-cli": patch
---

`agent-intent sync` pulls every Ledger Sync account again on its first run after a wallet-cli upgrade, so accounts an older version skipped are imported once the new one supports them
