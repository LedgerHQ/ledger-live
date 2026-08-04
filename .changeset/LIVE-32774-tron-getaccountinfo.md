---
"@ledgerhq/coin-tron": minor
---

Implement `getAccountInfo` in coin-tron (ADR-045). It polls `wallet/getaccountresource` and returns the Tron account metadata `{ type: "tron", energyLimit, energy, bandwidth }`, where `energy` and `bandwidth` are the available amounts (limit − used) and `energyLimit` is the total energy limit.
