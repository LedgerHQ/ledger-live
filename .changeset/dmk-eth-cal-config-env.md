---
"@ledgerhq/live-signer-evm": patch
---

evm: wire the DMK context module CAL URL from `getEnv("CAL_SERVICE_URL")` via `setCalConfig`, so the EVM signer no longer relies on the context-module hardcoded default and the CAL base URL has a single env-driven source of truth (prep for the Gravitee URL switch)
