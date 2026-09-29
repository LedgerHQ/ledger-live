---
"@ledgerhq/coin-multiversx": minor
---

Fix MultiversX transaction history sync failing on accounts with more than 10,000 transactions. Pagination now moves past the API's 10,000-result window with a `before` cursor, so the full history is fetched.
