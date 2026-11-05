---
"@ledgerhq/coin-sui": patch
"ledger-live-desktop": patch
---

Count staked SUI in the account balance; spend and stake checks use the spendable balance only. Stake operations move the balance by their gas only, so the balance history stays consistent.
