---
"@ledgerhq/coin-cosmos": minor
---

Build Babylon (BABY) staking transactions by wrapping delegate/undelegate/redelegate messages in the x/epoching MsgWrapped* envelope (amino + proto). Chain-specific staking message types now live on the chain classes (Babylon, Zenrock) instead of inline currency-id checks.
