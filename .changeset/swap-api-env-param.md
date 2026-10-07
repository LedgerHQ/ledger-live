---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

- Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
- Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
