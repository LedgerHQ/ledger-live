---
"@ledgerhq/coin-mina": minor
---

Stop staking upstream failures from breaking the Mina account synchronisation: staking resources now degrade gracefully to the previous sync values, the validator list is fetched once and shared between accounts instead of once per account per sync, and validator requests go through the retrying network helper with a bounded pagination loop
