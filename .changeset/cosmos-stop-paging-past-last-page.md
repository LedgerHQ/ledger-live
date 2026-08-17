---
"@ledgerhq/coin-cosmos": patch
---

Stop requesting the page after the last one when fetching cosmos transaction history.

`CosmosAPI.fetchAllTransactions` looped until the accumulated tx count reached the response's `total`, trusting `total` even when the node served fewer transactions than it counted. On cosmos-sdk that extra request fails with `failed to search for txs: page should be within [1, N] range, given N+1`, which the gRPC gateway renders as HTTP 500 — retried twice by the network layer, then swallowed by the surrounding catch, leaving the account with an empty or truncated history. The loop now stops as soon as a page comes back shorter than the requested limit.

Also in `fetchTransactions`: an empty result serialized as `null` instead of `[]` is read as an empty list, and `total` is coerced to a number — the endpoint returns the uint64 as a string, while the declared type said `number`.
