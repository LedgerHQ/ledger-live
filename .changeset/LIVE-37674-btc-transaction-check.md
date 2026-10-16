---
"@ledgerhq/coin-bitcoin": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Screen Bitcoin transactions with the web3checks backend in `getTransactionStatus`: a potential risk adds a `TransactionCheckPotentialRisk` recipient warning and a critical threat a `TransactionCheckCriticalThreat` recipient error. Disabled unless `transactionChecks.url` is set in the coin config.
