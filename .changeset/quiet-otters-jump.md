---
"@ledgerhq/coin-multiversx": patch
---

Fix MultiversX (Elrond) transaction history pagination overrunning the API's 10000 result-window cap, which caused the Daily Coin Monitoring workflow to fail on accounts with many transactions
