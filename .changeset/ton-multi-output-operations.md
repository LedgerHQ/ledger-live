---
"@ledgerhq/coin-ton": minor
---

Fix TON (GRAM) account import/sync failing with `[ton] txn with > 1 output not expected` when the account history contains transactions with more than one outgoing message. Such transactions (e.g. wallet v4/v5 batch sends, or a main transfer plus a small secondary message) are now aggregated into a single OUT operation whose value is the sum of the account's outgoing messages and whose recipients list every destination, instead of throwing and aborting the whole account synchronization.
