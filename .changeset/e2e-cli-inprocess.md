---
"@ledgerhq/live-common": patch
---

e2e: run the 4 CLI commands (getAddress, liveData, token approval, tokenAllowance) in-process instead of spawning `apps/cli`, keeping the same `runCli*` signatures
