---
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-cardano": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-framework": minor
---

feat(coin-framework): add postSync support to scanAccounts and apply across coins [LIVE-21755]

Adds optional postSync hook to makeScanAccounts (invoked after account shape build).
Applies postSync in bitcoin, cardano, evm, and tron currency bridges.
Exports tron postSync so it can be passed during scanning.
Ensures scanAccounts benefits from the same normalization/cleanup logic as sync without breaking existing callers (default no-op).
