---
"@ledgerhq/coin-hedera": patch
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/live-common": patch
---

fix "view in explorer" button in unconfirmed Hedera transaction details by adding "extra.transactionId" fallback
move getTransactionExplorer from LLD to coin module
support custom getTransactionExplorer in ledger-live-mobile