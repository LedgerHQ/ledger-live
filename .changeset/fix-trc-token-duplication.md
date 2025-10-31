---
"@ledgerhq/cryptoassets": minor
---

Fix TRC10/TRC20 token duplication causing inconsistent lookups

- Eliminated 2,815 contract address conflicts between TRC10 and TRC20 tokens
- Prioritized TRC20 tokens when contract addresses exist in both files
- Ensured consistent token resolution for `byAddress` and `byId` lookups
- Aligned local data with backend CAL API behavior
