---
"@ledgerhq/coin-aleo": minor
---

Persist the Aleo staking position on the account. Each public sync now reads the `credits.aleo` `bonded` and `unbonding` mappings and stores `bondedBalance`, `bondedValidator`, `unbondingBalance` and `unbondingHeight` on `aleoResources`, so a staked position survives serialization and is readable without an extra fetch.
