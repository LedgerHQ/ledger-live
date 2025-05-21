---
"@ledgerhq/coin-stellar": minor
---

fix(BACK-8848): [coin-modules][stellar] push down filtering predicate

* `listOperations` uses N+1 RPC requests instead of just 1, because it fetches block metadata for each transaction
* `minHeight` is only applied after doing all this, so when requesting operations on an up to date address we do the
  N+1 requests for the whole first page (200 txs), then throw out everything
* => push down predicate to the inner level so that we do only 1 RPC request
