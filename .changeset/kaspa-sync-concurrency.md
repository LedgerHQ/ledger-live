---
"@ledgerhq/coin-kaspa": minor
---

fix(kaspa): stabilize account sync for accounts with many used addresses

`scanOperations` fetched transactions for every used address with an unbounded
`Promise.all`. Accounts with many used addresses (e.g. 170+) fired that many heavy
`full-transactions-page` requests at once, exhausting the connection pool and
causing intermittent transient failures (ECONNRESET / connect timeout / 5xx) that
aborted the whole sync with "Network response was not ok." / "fetch failed".

Cap concurrency at 5 via `promiseAllBatched` (consistent with other coin modules)
and retry transient failures in `getTransactions`. This removes the self-inflicted
congestion and tolerates the occasional blip.
