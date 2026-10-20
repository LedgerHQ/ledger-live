---
"@ledgerhq/wallet-btc": minor
"@ledgerhq/coin-bitcoin": minor
---

chore(coin): prefix unused parameters with an underscore

The packages now build with `noUnusedLocals` and `noUnusedParameters`. The parameters they never read are renamed with a leading underscore; signatures and behaviour are unchanged.
