---
"@ledgerhq/coin-casper": minor
---

Wire craftTransactionData to the framework's generic implementation; Casper carries no transaction data, so it returns `{ type: "none" }` instead of throwing.