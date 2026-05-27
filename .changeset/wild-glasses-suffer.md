---
"@ledgerhq/asset-aggregation": patch
---

Fix cross-network amount aggregation when a meta-currency's network tokens have different magnitudes (e.g. USDT on Ethereum with magnitude 6 and on BSC with magnitude 18). Network balances are now normalized to the meta-currency's reference magnitude before being summed, preventing incorrect totals.
