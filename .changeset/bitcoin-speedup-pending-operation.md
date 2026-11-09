---
"@ledgerhq/coin-bitcoin": minor
---

fix(coin-bitcoin): keep pending operations until their transaction is mined

The post-sync reconciliation dropped an optimistic operation as soon as the explorer returned
its transaction, even unconfirmed. The edit flow then no longer found it in `pendingOperations`
and only offered to cancel it: speeding up a transaction worked only until the first sync after
the explorer indexed it. Only mined operations now resolve a pending one.
