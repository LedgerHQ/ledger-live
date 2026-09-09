---
"@ledgerhq/coin-concordium": minor
"@ledgerhq/live-common": minor
---

Build PLT token sub-accounts during Concordium account sync, behind the new `enableTokens` coin config flag (off by default). Tokens are resolved from the CAL by on-chain address, per-token pause and allow/deny state is cached on the account, and PLT balances are reported on the `api/` surface.
