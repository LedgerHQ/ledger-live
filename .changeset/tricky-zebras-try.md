---
"live-mobile": patch
"@ledgerhq/live-common": patch
"ledger-live-mobile-e2e-tests": patch
---

Add Detox e2e coverage for the SEI EVM staking delegate flow. Adds a testID to validator rows in the EVM delegation flow to make them addressable from e2e, plus SEI entries in the shared e2e enums (Currency, Account, Network) and a new EVM-shaped delegate helper.
