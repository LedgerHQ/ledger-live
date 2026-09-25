---
"@ledgerhq/coin-multiversx": patch
---

Fix MultiversX transaction history pagination to no longer silently drop the oldest transactions on accounts with more than 10,000 transactions. Instead of stopping at the API's `from + size <= 10000` result-window cap, pagination now shifts the window using a `before` timestamp cursor once the cap is reached, and dedupes results by transaction hash, so the full history is fetched.
