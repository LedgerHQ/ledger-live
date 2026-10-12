---
"@ledgerhq/wallet-cli": patch
---

Report Ledger Sync accounts that use a derivation mode this wallet-cli version doesn't know as skipped instead of invalid, so `agent-intent sync` doesn't re-pull every time
