---
"@ledgerhq/coin-hedera": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

fix "view in explorer" button in unconfirmed Hedera transaction details by adding "extra.transactionId" fallback
move getTransactionExplorer from LLD to coin module
support custom getTransactionExplorer in ledger-live-mobile