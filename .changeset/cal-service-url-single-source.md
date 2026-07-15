---
"@ledgerhq/live-common": minor
---

evm: source the EVM signer `calServiceURL` from `getEnv("CAL_SERVICE_URL")` instead of relying on the hw-app-eth hardcoded default, so the CAL base URL has a single env-driven source of truth
