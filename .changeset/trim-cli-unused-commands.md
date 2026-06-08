---
"@ledgerhq/live-cli": minor
---

Trim the CLI to the commands actually used inside the monorepo. Removed 53 commands that no test, script or CI invokes (most `device`/firmware/manager/lock-screen utilities and one-off `test*`/`generate*` helpers), keeping only the load-bearing set: `getAddress`, `liveData`, `send`, `tokenAllowance`, `botTransfer`, `version` (used by e2e and CI), plus `proxy` (dev transport bridge with no DMK replacement). Also dropped the dependencies those commands were the sole users of, plus pre-existing unused dependencies of the package.
