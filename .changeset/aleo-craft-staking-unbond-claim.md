---
"@ledgerhq/coin-aleo": minor
---

feat: craft unbond_public and claim_unbond_public staking transactions — the two backend wire
intents, the staker guard, their credits.aleo function names, the shared staking mode →
operation-type table, fee-valued optimistic operations for all three staking modes, and no Amount
row on a claim's device confirmation. No user-reachable behaviour yet: nothing can construct a
transaction in either mode until the bridge transaction mode union is extended.
