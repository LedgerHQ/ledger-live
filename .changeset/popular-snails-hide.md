---
"@ledgerhq/coin-tezos": minor
---

`mapIntentTypeToTezosMode` to correctly map staking intents (`stake`, `unstake`, `finalize_unstake`) to their own operation modes instead of aliasing them to `delegate`/`undelegate`
