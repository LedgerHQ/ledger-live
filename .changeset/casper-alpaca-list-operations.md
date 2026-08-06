---
"@ledgerhq/coin-casper": minor
---

Implement `listOperations` on the Casper Alpaca (CoinModuleApi) surface.

Native CSPR transfers are now returned as framework `Operation`s with the real `block_height`,
block hash and block time, the deploy's actual `cost` as `tx.fees`, and `value` holding the transfer
amount alone so the fee is no longer double-counted. `minHeight` and `limit` are honoured and used
to stop paging early; `order` supports the indexer's native `desc` and raises for `asc`. Pagination
uses a non-volatile block-height/deploy-hash cursor rather than a page index, so a stale cursor
still resumes consistently.

Also corrects `ITxnHistoryData` and `IndexerResponseRoot`, which declared fields the indexer never
returns (`amount`, `pages`) and omitted ones it does (`block_height`, `caller_hash`, `consumed_gas`,
`refund_amount` and others).
