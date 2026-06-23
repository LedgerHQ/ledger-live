---
"@ledgerhq/coin-sui": minor
---

Fix Sui GraphQL transport: normalize coin/event type tags so operations & staking events aren't dropped, map fee-simulation failures to a friendly insufficient-funds error, and skip not-yet-finalized txs that showed as Failed/1970.
