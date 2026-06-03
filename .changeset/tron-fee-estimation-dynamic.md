---
"@ledgerhq/coin-tron": minor
---

Fix coin-framework `estimateFees` to use real on-chain data (chain parameters, simulated energy via triggerConstantContract) instead of hardcoded constants, and stop adding the 1.1 TRX native activation fee on TRC20/TRC10 transfers to inactive recipients
