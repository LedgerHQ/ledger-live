---
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Screen the recipient with the web3checks backend in the account bridge `getTransactionStatus`, at the recipient step like the OFAC check: a potential risk adds a `TransactionCheckPotentialRisk` recipient warning and a critical threat a `TransactionCheckCriticalThreat` recipient warning, the user can still continue. A family opts in with the `getTransactionCheckPayload` bridge extension (Bitcoin sends the unsigned PSBT spending the whole balance to the recipient); the check stays off unless `transactionChecks.url` and `transactionChecks.chainId` are set in `config_currency_<id>`.
