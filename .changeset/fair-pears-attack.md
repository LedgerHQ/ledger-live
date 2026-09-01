---
"@ledgerhq/coin-casper": patch
---

Wire craftTransactionData to the framework's generic implementation; Casper carries no transaction data, so it returns `{ type: "none" }` instead of throwing.