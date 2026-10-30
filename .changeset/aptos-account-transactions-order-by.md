---
"@ledgerhq/coin-aptos": minor
---

fix(coin-aptos): order account transactions by version when paging the indexer

The offset-paginated `account_transactions` queries had no `order_by`, so page boundaries relied on the database's implicit row order. They now order by ascending transaction version.
