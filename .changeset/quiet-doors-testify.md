---
"@ledgerhq/wallet-cli": patch
---

Add a living regression plan under `docs/regression/`, split by whether a case needs a Ledger on USB, plus an automated harness (`scripts/regression/run.sh`) for the no-device cases: repo gates, the `skill` command group, the first-run nudge, and every read/dry-run command path
