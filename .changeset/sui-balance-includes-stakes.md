---
"@ledgerhq/coin-sui": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Count staked SUI in the account balance; spend and stake checks use the spendable balance only. Stake operations move the balance by their gas only, and an unstake also by its reward, so the balance history stays consistent.
