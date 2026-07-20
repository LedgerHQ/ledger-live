---
"@ledgerhq/coin-cosmos": patch
---

Fix the Babylon (BABY) undelegation completion date, which showed the chain's 21-day x/staking unbonding time instead of Babylon's ~2-day fast unbonding. On epoched chains the date is now re-anchored to the unbonding's creation height plus the effective unbonding period.
