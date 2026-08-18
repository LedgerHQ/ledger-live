---
"@ledgerhq/coin-cosmos": patch
---

Stop discarding a cosmos transaction history when one page of it fails.

`CosmosAPI.fetchAllTransactions` pages until the accumulated tx count reaches the response's `total`. Any page that failed propagated to the surrounding catch, which returned an empty array — so a single bad page reported the account as having no history at all. Two causes are live on mainnet today: a page past the last one, when a node serves fewer transactions than its `total` counts (`failed to search for txs: page should be within [1, N] range`), and a transaction the node can no longer decode (`unable to resolve type URL /tendermint.liquidity.v1beta1.MsgDepositWithinBatch: tx parse error`, permanent on cosmoshub for accounts holding pre-removal liquidity-module txs). Both are answered as HTTP 500 and retried twice by the network layer. A failing page now ends the walk and keeps the pages already fetched.

Also in `fetchTransactions`: an empty result serialized as `null` instead of `[]` is read as an empty list, and `total` is coerced to a number — the endpoint returns the uint64 as a string, while the declared type said `number`.
