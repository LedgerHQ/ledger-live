---
"@ledgerhq/wallet-cli": patch
---

`agent-intent sync` pulls every Ledger Sync account again on its first run after the wallet-cli version changes, so accounts an older version skipped are imported once a newer one supports them
